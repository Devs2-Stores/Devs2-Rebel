(function() {
'use strict';

function formatPriceNumber(value) {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * collection.js — Shopify Native Storefront Filtering
 *
 * Uses Shopify Section Rendering API for AJAX filtering, sorting, and pagination.
 */

/* ═══════════════════════════════════════════════════
   FacetFilters — Main filter/sort/pagination controller
   ═══════════════════════════════════════════════════ */
class FacetFilters extends HTMLElement {
  constructor() {
    super();
    this.filterForm = null;
    this.sortSelect = null;
    this.sectionId = null;
    this.collectionUrl = null;
    this.debouncedSubmit = null;
    this.abortController = null;
  }

  connectedCallback() {
    this.sectionId = this.dataset.sectionId;
    this.collectionUrl = this.dataset.collectionUrl || window.location.pathname;

    this.filterForm = this.querySelector('#FacetFilterForm');
    this.sortSelects = Array.from(this.querySelectorAll('.collection-sort__select'));
    this.sortSelect = this.sortSelects[0] || null;

    this.debouncedSubmit = debounce(this.submitFilters.bind(this), 300);

    this.paginationType = this.dataset.paginationType || 'pagination';
    this.filterLayout = this.dataset.filterLayout || 'sidebar';
    this.lifecycle = new AbortController();

    this.bindFilterEvents();
    this.bindSortEvents();
    this.bindPaginationEvents();
    this.bindDrawerEvents();
    this.bindFilterColumnToggle();
    this.bindFilterModal();
    this.bindLoadMore();
    this.bindInfiniteScroll();
    this.bindViewToggle();
    this.bindActiveFilterRemove();
    this.initCollapsibleLists();
    this.initHorizontalFilters(-1);
    this.bindHorizontalFilterDismiss();
    this.bindDescToggle();
    var self = this;
    window.addEventListener('popstate', function() {
      self.fetchAndRender(window.location.href, false);
    }, { signal: this.lifecycle.signal });
  }

  disconnectedCallback() {
    if (this.lifecycle) this.lifecycle.abort();
    if (this.abortController) this.abortController.abort();
    if (this.infiniteObserver) this.infiniteObserver.disconnect();
  }

  /* ── Filter form ────────────────────────────────── */

  bindFilterEvents() {
    if (!this.filterForm) return;

    // Checkbox changes
    var self = this;
    this.filterForm.addEventListener('change', function(e) {
      if (e.target.matches('input[type="checkbox"]')) {
        if (e.target.hasAttribute('data-price-preset')) return;
        self.debouncedSubmit();
      }
    });

    // Price range — debounced on input
    this.bindPriceRangeEvents();
  }

  bindPriceRangeEvents() {
    if (!this.filterForm) return;

    var self = this;
    var priceInputs = this.filterForm.querySelectorAll('.facet-filter__price-input');
    var pricePresets = this.filterForm.querySelectorAll('[data-price-preset]');
    var priceSliders = this.filterForm.querySelectorAll('[data-price-slider]');

    priceInputs.forEach(function(input) {
      input.addEventListener('input', debounce(function() {
        pricePresets.forEach(function(preset) { preset.checked = false; });
        self.submitFilters();
      }, 300));
    });

    pricePresets.forEach(function(preset) {
      preset.addEventListener('change', function() {
        pricePresets.forEach(function(otherPreset) {
          if (otherPreset !== preset) otherPreset.checked = false;
        });

        var minInput = self.filterForm.querySelector('input[name$=".gte"]');
        var maxInput = self.filterForm.querySelector('input[name$=".lte"]');

        if (preset.checked) {
          if (minInput) minInput.value = preset.dataset.min || '';
          if (maxInput) maxInput.value = preset.dataset.max || '';
        } else {
          if (minInput) minInput.value = '';
          if (maxInput) maxInput.value = '';
        }

        self.submitFilters();
      });
    });

    priceSliders.forEach(function(slider) {
      var minRange = slider.querySelector('[data-price-slider-min]');
      var maxRange = slider.querySelector('[data-price-slider-max]');
      var minField = slider.querySelector('[data-price-slider-min-field]');
      var maxField = slider.querySelector('[data-price-slider-max-field]');
      var minLabel = slider.querySelector('[data-price-slider-min-label]');
      var maxLabel = slider.querySelector('[data-price-slider-max-label]');
      var currency = slider.dataset.currencySymbol || '$';
      if (!minRange || !maxRange || !minField || !maxField) return;

      var syncSlider = function() {
        var minValue = parseFloat(minRange.value) || 0;
        var maxValue = parseFloat(maxRange.value) || 0;

        if (minValue > maxValue) {
          if (document.activeElement === minRange) {
            maxValue = minValue;
            maxRange.value = String(maxValue);
          } else {
            minValue = maxValue;
            minRange.value = String(minValue);
          }
        }

        minField.value = minValue > 0 ? String(minValue) : '';
        maxField.value = maxValue > 0 ? String(maxValue) : '';

        if (minLabel) minLabel.textContent = currency + formatPriceNumber(minValue);
        if (maxLabel) maxLabel.textContent = currency + formatPriceNumber(maxValue);
      };

      var submitSlider = debounce(function() {
        syncSlider();
        self.submitFilters();
      }, 300);

      minRange.addEventListener('input', function() {
        syncSlider();
        submitSlider();
      });
      maxRange.addEventListener('input', function() {
        syncSlider();
        submitSlider();
      });
      syncSlider();
    });
  }

  buildTargetUrl(searchParams) {
    var targetUrl = new URL(this.collectionUrl, window.location.origin);
    targetUrl.search = searchParams.toString();
    return targetUrl.pathname + (targetUrl.search ? targetUrl.search : '');
  }

  submitFilters() {
    var searchParams = this.buildSearchParams();
    var url = this.buildTargetUrl(searchParams);
    this.fetchAndRender(url);
  }

  buildSearchParams() {
    var params = new URLSearchParams();
    var baseUrl = new URL(this.collectionUrl, window.location.origin);
    ['q', 'type', 'options[prefix]'].forEach(function(key) {
      if (baseUrl.searchParams.has(key)) {
        params.set(key, baseUrl.searchParams.get(key));
      }
    });
    if (!this.filterForm) return params;

    // Collect checkbox filters
    var checkboxes = this.filterForm.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(function(cb) {
      if (!cb.name || cb.hasAttribute('data-price-preset')) return;
      params.append(cb.name, cb.value);
    });

    // Collect price range
    var priceInputs = this.filterForm.querySelectorAll('.facet-filter__price-input');
    priceInputs.forEach(function(input) {
      if (input.value && input.value.trim() !== '') {
        var priceValue = parseFloat(input.value);
        if (!isNaN(priceValue) && priceValue > 0) {
          params.set(input.name, priceValue.toString());
        }
      }
    });

    // Preserve sort
    if (this.sortSelect && this.sortSelect.value) {
      params.set('sort_by', this.sortSelect.value);
    }

    return params;
  }

  /* ── Sort ────────────────────────────────────────── */

  bindSortEvents() {
    if (this.sortSelects.length === 0) return;
    var self = this;

    this.sortSelects.forEach(function(select) {
      select.addEventListener('change', function() {
        var value = this.value;
        self.sortSelects.forEach(function(other) { other.value = value; });
        var searchParams = self.buildSearchParams();
        searchParams.set('sort_by', value);
        var url = self.buildTargetUrl(searchParams);
        self.fetchAndRender(url);
      });
    });
  }

  /* ── Pagination ─────────────────────────────────── */

  bindPaginationEvents() {
    var self = this;
    document.addEventListener('click', function(e) {
      var link = e.target.closest('.section-pagination a, #CollectionPagination a');
      if (!link) return;
      e.preventDefault();

      var href = link.getAttribute('href');
      if (!href) return;

      // Build URL preserving current filters + sort + new page
      var linkUrl = new URL(href, window.location.origin);
      var page = linkUrl.searchParams.get('page');

      var searchParams = self.buildSearchParams();
      if (page) searchParams.set('page', page);

      var url = self.buildTargetUrl(searchParams);
      self.fetchAndRender(url);
      self.scrollToProducts();
    }, { signal: this.lifecycle.signal });
  }

  /* ── Active filter remove ───────────────────────── */

  bindActiveFilterRemove() {
    var self = this;
    this.addEventListener('click', function(e) {
      var removeLink = e.target.closest('[data-filter-remove]');
      if (!removeLink) return;
      e.preventDefault();

      var href = removeLink.getAttribute('href');
      if (!href) return;

      self.fetchAndRender(href);
    });
  }

  /* ── Section Rendering — core fetch + render ────── */

  fetchAndRender(url, updateHistory) {
    if (updateHistory === undefined) updateHistory = true;
    // Cancel previous request
    if (this.abortController) this.abortController.abort();
    this.abortController = new AbortController();

    // Show loading state
    this.classList.add('is-loading');

    // Build section rendering URL
    var fetchUrl = new URL(url, window.location.origin);
    fetchUrl.searchParams.set('section_id', this.sectionId);

    var self = this;
    fetch(fetchUrl.toString(), {
      signal: this.abortController.signal,
      headers: { 'Accept': 'text/html' }
    })
    .then(function(res) {
      if (!res.ok) throw new Error('Network error: ' + res.status);
      return res.text();
    })
    .then(function(html) {
      self.renderSectionResponse(html);

      // Update URL without reload
      var cleanUrl = new URL(url, window.location.origin);
      cleanUrl.searchParams.delete('section_id');
      if (updateHistory) window.history.pushState({}, '', cleanUrl.toString());

      self.classList.remove('is-loading');

      // Re-emit event
      document.dispatchEvent(new CustomEvent('collection:filtered'));
    })
    .catch(function(err) {
      if (err.name === 'AbortError') return;
      self.classList.remove('is-loading');
      self.showLoadError();
    });
  }

  showLoadError() {
    var message = ((themeConfig.strings || {}).collection || {}).loadError;
    if (message && typeof showToast === 'function') showToast(message, 'error', 4000);
  }

  renderSectionResponse(html) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, 'text/html');
    var focusState = this.captureFocusState();

    // Replace product grid
    var newProducts = doc.querySelector('#CollectionProducts');
    var currentProducts = document.querySelector('#CollectionProducts');
    if (newProducts && currentProducts) {
      currentProducts.innerHTML = newProducts.innerHTML;
    }

    // Replace pagination
    var newPagination = doc.querySelector('#CollectionPagination');
    var currentPagination = document.querySelector('#CollectionPagination');
    if (newPagination && currentPagination) {
      currentPagination.innerHTML = newPagination.innerHTML;
    }
    if (this.paginationType === 'infinite') this.observeInfiniteSentinel();

    // Replace filters (to update counts & active states)
    var newFilters = doc.querySelector('#FacetFiltersContainer');
    var currentFilters = document.querySelector('#FacetFiltersContainer');
    if (newFilters && currentFilters) {
      var openIdx = this.openFacetIndex();
      currentFilters.innerHTML = newFilters.innerHTML;
      // Re-init collapsible lists and events on new filter HTML
      this.reinitFilters(openIdx);
    }

    // Replace active filter tags above grid
    var newActive = doc.querySelector('#CollectionActiveFilters');
    var currentActive = document.querySelector('#CollectionActiveFilters');
    if (newActive && currentActive) {
      currentActive.innerHTML = newActive.innerHTML;
    } else if (newActive && !currentActive) {
      var productsContainer = document.querySelector('#CollectionProducts');
      if (productsContainer) {
        productsContainer.insertAdjacentElement('beforebegin', newActive);
      }
    } else if (!newActive && currentActive) {
      currentActive.remove();
    }

    // Replace sort toolbar (product count)
    var newSort = doc.querySelector('.collection-sort');
    var currentSort = document.querySelector('.collection-sort');
    if (newSort && currentSort) {
      // Only update count text, preserve sort value
      var newCount = newSort.querySelector('.collection-sort__count-text');
      var currentCount = currentSort.querySelector('.collection-sort__count-text');
      if (newCount && currentCount) {
        currentCount.innerHTML = newCount.innerHTML;
      }
    }

    var newTabs = doc.querySelector('.search-template__tabs');
    var currentTabs = document.querySelector('.search-template__tabs');
    if (newTabs && currentTabs) {
      currentTabs.innerHTML = newTabs.innerHTML;
    }
    var newSearchCount = doc.querySelector('.search-template__count');
    var currentSearchCount = document.querySelector('.search-template__count');
    if (newSearchCount && currentSearchCount) {
      currentSearchCount.innerHTML = newSearchCount.innerHTML;
    }

    // Update mobile filter badge
    var newBadge = doc.querySelector('.collection-sort__filter-btn .collection-template__filter-badge');
    var currentBadgeContainer = document.querySelector('.collection-sort__filter-btn');
    var currentBadge = document.querySelector('.collection-sort__filter-btn .collection-template__filter-badge');
    if (currentBadgeContainer) {
      if (newBadge) {
        if (currentBadge) {
          currentBadge.textContent = newBadge.textContent;
        } else {
          currentBadgeContainer.insertAdjacentHTML('beforeend',
            '<span class="collection-template__filter-badge">' + newBadge.textContent + '</span>');
        }
      } else if (currentBadge) {
        currentBadge.remove();
      }
    }

    var newApplyLabel = doc.querySelector('[data-filter-apply-label]');
    if (newApplyLabel) {
      document.querySelectorAll('[data-filter-apply-label]').forEach(function(el) {
        el.textContent = newApplyLabel.textContent;
      });
    }

    var newSortSelect = doc.querySelector('.collection-sort__select');
    if (newSortSelect) {
      this.sortSelects.forEach(function(select) { select.value = newSortSelect.value; });
    }

    var liveRegion = document.getElementById('CollectionLiveRegion');
    var countText = newSort ? newSort.querySelector('.collection-sort__count-text') : null;
    if (liveRegion && countText) {
      liveRegion.textContent = countText.textContent.trim().replace(/\s+/g, ' ');
    }

    // Re-apply view mode
    var savedView = this.readViewMode() || 'grid';
    this.setViewMode(savedView);

    this.restoreFocusState(focusState);
  }

  captureFocusState() {
    var el = document.activeElement;
    if (!el || el === document.body) return null;
    var facets = document.getElementById('FacetFiltersContainer');
    if (facets && facets.contains(el)) {
      return { scope: 'facets', id: el.id, index: this.focusablesIn(facets).indexOf(el) };
    }
    var chips = document.getElementById('CollectionActiveFilters');
    if (chips && chips.contains(el)) {
      return { scope: 'chips', index: this.focusablesIn(chips).indexOf(el) };
    }
    return null;
  }

  restoreFocusState(state) {
    if (!state) return;
    var target = null;
    if (state.scope === 'facets') {
      var facets = document.getElementById('FacetFiltersContainer');
      var byId = state.id ? document.getElementById(state.id) : null;
      target = byId && !byId.disabled ? byId : (facets ? this.focusablesIn(facets)[state.index] : null);
    } else {
      var chips = document.getElementById('CollectionActiveFilters');
      var remaining = chips ? this.focusablesIn(chips) : [];
      target = remaining[Math.min(Math.max(state.index, 0), remaining.length - 1)];
    }
    if (!target) target = document.getElementById('CollectionProducts');
    if (target) target.focus({ preventScroll: true });
  }

  focusablesIn(container) {
    return Array.from(container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled])'));
  }

  reinitFilters(openIdx) {
    // Re-bind filter form
    this.filterForm = this.querySelector('#FacetFilterForm');
    if (this.filterForm) {
      var self = this;

      this.filterForm.addEventListener('change', function(e) {
        if (e.target.matches('input[type="checkbox"]')) {
          if (e.target.hasAttribute('data-price-preset')) return;
          self.debouncedSubmit();
        }
      });

      this.bindPriceRangeEvents();
    }

    // Active filter removes — no re-bind needed, event delegation on 'this' persists

    // Re-init collapsible
    this.initCollapsibleLists();
    this.initHorizontalFilters(openIdx);
  }

  /* ── Horizontal filter bar (desktop dropdowns) ─────── */

  isHorizontalBar() {
    return this.filterLayout === 'horizontal' && window.matchMedia('(min-width: 1024px)').matches;
  }

  openFacetIndex() {
    var open = this.querySelector('#FacetFiltersContainer .facet-filter__details[open]');
    if (!open) return -1;
    return Array.from(this.querySelectorAll('#FacetFiltersContainer facet-filter')).indexOf(open.closest('facet-filter'));
  }

  initHorizontalFilters(openIdx) {
    if (!this.isHorizontalBar()) return;
    var facets = this.querySelectorAll('#FacetFiltersContainer facet-filter');
    facets.forEach(function(facet, i) {
      var details = facet.querySelector('.facet-filter__details');
      if (!details) return;
      if (i === openIdx) details.setAttribute('open', '');
      else details.removeAttribute('open');
    });
  }

  bindHorizontalFilterDismiss() {
    if (this.filterLayout !== 'horizontal') return;
    var self = this;
    var signal = this.lifecycle.signal;
    var closeAll = function(except) {
      self.querySelectorAll('#FacetFiltersContainer .facet-filter__details[open]').forEach(function(d) {
        if (d !== except) d.removeAttribute('open');
      });
    };
    this.addEventListener('toggle', function(e) {
      if (!self.isHorizontalBar() || !e.target.matches('.facet-filter__details') || !e.target.open) return;
      closeAll(e.target);
    }, { capture: true, signal: signal });
    document.addEventListener('click', function(e) {
      if (!self.isHorizontalBar() || e.target.closest('facet-filter')) return;
      closeAll(null);
    }, { signal: signal });
    document.addEventListener('keydown', function(e) {
      if (e.key !== 'Escape' || !self.isHorizontalBar()) return;
      var open = self.querySelector('#FacetFiltersContainer .facet-filter__details[open]');
      if (!open) return;
      open.removeAttribute('open');
      var summary = open.querySelector('summary');
      if (summary) summary.focus();
    }, { signal: signal });
  }

  /* ── Filter drawer (mobile) ─────────────────────── */

  bindDrawerEvents() {
    var drawer = document.getElementById('CollectionFilterDrawer');
    if (!drawer) return;
    var overlay = document.querySelector('.collection-template__filter-overlay');

    var close = function() {
      if (!drawer.classList.contains('is-open')) return;
      drawer.classList.remove('is-open');
      drawer.removeAttribute('role');
      drawer.removeAttribute('aria-modal');
      drawer.removeAttribute('aria-labelledby');
      if (overlay) overlay.classList.remove('is-visible');
      ThemeUtils.unlockScroll();
      ThemeUtils.releaseFocus(drawer);
    };

    document.querySelectorAll('[data-action="open-filter"]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (drawer.classList.contains('is-open')) return;
        drawer.classList.add('is-open');
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-labelledby', 'CollectionFilterDrawerTitle');
        if (overlay) overlay.classList.add('is-visible');
        ThemeUtils.lockScroll();
        ThemeUtils.trapFocus(drawer, btn);
      });
    });

    document.querySelectorAll('[data-action="close-filter"]').forEach(function(btn) {
      btn.addEventListener('click', close);
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') close();
    }, { signal: this.lifecycle.signal });

    window.matchMedia('(min-width: 1024px)').addEventListener('change', function(e) {
      if (e.matches) close();
    }, { signal: this.lifecycle.signal });
  }

  /* ── Desktop filter column toggle ───────────────── */

  bindFilterColumnToggle() {
    var toggleBtns = document.querySelectorAll('[data-action="toggle-filter-column"]');
    var wrapper = this.classList.contains('collection-template__wrapper')
      ? this
      : this.querySelector('.collection-template__wrapper');
    if (!wrapper || toggleBtns.length === 0) return;

    toggleBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        wrapper.classList.toggle('collection-template__wrapper--filter-collapsed');
      });
    });
  }

  /* ── Load more button ──────────────────────────── */

  bindLoadMore() {
    if (this.paginationType !== 'load_more') return;
    var self = this;

    document.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-action="load-more"]');
      if (!btn) return;
      e.preventDefault();

      var nextUrl = btn.getAttribute('data-next-url');
      if (!nextUrl || btn.disabled) return;

      btn.disabled = true;
      btn.classList.add('is-loading');

      self.fetchAppendProducts(nextUrl, btn);
    }, { signal: this.lifecycle.signal });
  }

  fetchAppendProducts(url, triggerEl) {
    var self = this;
    var sectionUrl = url + (url.indexOf('?') > -1 ? '&' : '?') + 'sections=' + this.sectionId;

    fetch(sectionUrl)
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(data) {
        var html = data && data[self.sectionId];
        if (typeof html !== 'string') throw new Error('Missing section');
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var active = document.activeElement;
        var focusNewItem = !!triggerEl && (!active || active === document.body || active === triggerEl);

        // Append new product cards
        var newItems = doc.querySelectorAll('.product-cards__item');
        var productList = self.querySelector('.product-cards');
        if (productList && newItems.length > 0) {
          newItems.forEach(function(item) {
            productList.appendChild(item);
          });
        }

        if (self.hasAttribute('data-search-results')) self.appendSearchContent(doc);

        // Update pagination area
        var newPagination = doc.querySelector('#CollectionPagination');
        var currentPagination = self.querySelector('#CollectionPagination');
        if (currentPagination && newPagination) {
          currentPagination.innerHTML = newPagination.innerHTML;
        }

        var newCount = doc.querySelector('.collection-sort__count-text');
        var currentCount = document.querySelector('.collection-sort__count-text');
        if (newCount && currentCount) {
          currentCount.innerHTML = newCount.innerHTML;
        }

        var liveRegion = document.getElementById('CollectionLiveRegion');
        if (liveRegion && newItems.length > 0) {
          liveRegion.textContent = newCount
            ? newCount.textContent.trim().replace(/\s+/g, ' ')
            : themeConfig.strings.collection.moreLoaded;
        }

        if (focusNewItem && newItems.length > 0) {
          var firstLink = newItems[0].querySelector('a[href]');
          if (firstLink) firstLink.focus();
        }

        // Re-bind events for new content
        if (self.paginationType === 'load_more') {
          // New load-more button is already wired via event delegation
        }
        if (self.paginationType === 'infinite') {
          self.observeInfiniteSentinel();
        }
      })
      .catch(function() {
        if (triggerEl) {
          triggerEl.disabled = false;
          triggerEl.classList.remove('is-loading');
        }
        self.showLoadError();
      });
  }

  appendSearchContent(doc) {
    var self = this;
    doc.querySelectorAll('[data-search-panel]').forEach(function(panel) {
      var type = panel.getAttribute('data-search-panel');
      if (type === 'products') return;
      var current = self.querySelector('[data-search-panel="' + type + '"]');
      if (current) {
        var list = current.querySelector('.search-template__content-list');
        if (!list) return;
        panel.querySelectorAll('.search-template__content-item').forEach(function(item) { list.appendChild(item); });
      } else {
        var pagination = self.querySelector('#CollectionPagination');
        if (!pagination) return;
        panel.hidden = true;
        pagination.insertAdjacentElement('beforebegin', panel);
      }
    });

    var addCount = function(currentEl, newEl) {
      var added = parseInt((newEl.textContent.match(/\d+/) || ['0'])[0], 10);
      currentEl.textContent = currentEl.textContent.replace(/\d+/, function(m) { return String(parseInt(m, 10) + added); });
      return added;
    };
    doc.querySelectorAll('[data-search-tab]').forEach(function(newTab) {
      var currentTab = self.querySelector('[data-search-tab="' + newTab.getAttribute('data-search-tab') + '"]');
      var currentSpan = currentTab && currentTab.querySelector('span');
      var newSpan = newTab.querySelector('span');
      if (!currentSpan || !newSpan) return;
      if (addCount(currentSpan, newSpan) > 0) currentTab.disabled = false;
    });
    doc.querySelectorAll('[data-search-tab-count]').forEach(function(newInfo) {
      var currentInfo = self.querySelector('[data-search-tab-count="' + newInfo.getAttribute('data-search-tab-count') + '"]');
      if (currentInfo) addCount(currentInfo, newInfo);
    });
  }

  /* ── Infinite scroll ───────────────────────────── */

  bindInfiniteScroll() {
    if (this.paginationType !== 'infinite') return;
    this.isLoadingMore = false;
    this.observeInfiniteSentinel();
  }

  observeInfiniteSentinel() {
    var self = this;
    var sentinel = this.querySelector('[data-action="infinite-scroll"]');
    if (!sentinel) return;

    if (this.infiniteObserver) {
      this.infiniteObserver.disconnect();
    }

    this.infiniteObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting && !self.isLoadingMore) {
          var nextUrl = sentinel.getAttribute('data-next-url');
          if (!nextUrl) return;
          self.isLoadingMore = true;
          self.fetchAppendProducts(nextUrl, null);
          // isLoadingMore will be reset when new sentinel appears
          setTimeout(function() { self.isLoadingMore = false; }, 1000);
        }
      });
    }, { rootMargin: '200px' });

    this.infiniteObserver.observe(sentinel);
  }

  /* ── Filter modal ──────────────────────────────── */

  bindFilterModal() {
    if (this.filterLayout !== 'modal') return;
    var modal = document.getElementById('CollectionFilterModal');
    if (!modal) return;

    var close = function() {
      if (!modal.classList.contains('is-open')) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      ThemeUtils.unlockScroll();
      ThemeUtils.releaseFocus(modal);
    };

    document.querySelectorAll('[data-action="open-filter"], [data-action="open-filter-modal"]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (modal.classList.contains('is-open')) return;
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        ThemeUtils.lockScroll();
        ThemeUtils.trapFocus(modal, btn);
      });
    });

    modal.querySelectorAll('[data-action="close-filter-modal"]').forEach(function(btn) {
      btn.addEventListener('click', close);
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') close();
    }, { signal: this.lifecycle.signal });
  }

  /* ── View toggle (grid/list) and mobile density ─── */

  bindViewToggle() {
    var self = this;
    var viewBtns = document.querySelectorAll('.collection-sort__view-btn[data-view]');
    if (viewBtns.length === 0) return;

    var mainContainer = document.getElementById('CollectionMain');
    var defaultView = (mainContainer && mainContainer.dataset.defaultView) || 'grid';
    this.densityEnabled = !!(mainContainer && mainContainer.hasAttribute('data-density-toggle'));
    this.phoneQuery = window.matchMedia('(max-width: 749px)');
    var savedView = this.readViewMode() || defaultView;
    this.setViewMode(savedView);

    viewBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var mode = this.getAttribute('data-view');
        self.setViewMode(mode);
        ThemeUtils.storage.set('collection_view', mode);
      });
    });

    this.bindDensityToggle(mainContainer);
  }

  bindDensityToggle(mainContainer) {
    if (!this.densityEnabled) return;
    var self = this;
    var saved = ThemeUtils.storage.get('collection_density');
    var fallback = mainContainer.dataset.defaultColumnsMobile || '2';
    this.setDensity(saved === '1' || saved === '2' ? saved : fallback);

    document.querySelectorAll('.collection-sort__density-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var value = this.getAttribute('data-density');
        self.setDensity(value);
        ThemeUtils.storage.set('collection_density', value);
      });
    });

    this.phoneQuery.addEventListener('change', function() {
      self.setViewMode(self.readViewMode() || 'grid');
    }, { signal: this.lifecycle.signal });
  }

  setDensity(value) {
    var mainContainer = document.getElementById('CollectionMain');
    if (mainContainer) mainContainer.style.setProperty('--columns-mobile', value);
    document.querySelectorAll('.collection-sort__density-btn').forEach(function(btn) {
      var active = btn.getAttribute('data-density') === value;
      btn.setAttribute('aria-pressed', String(active));
      btn.classList.toggle('collection-sort__view-btn--active', active);
    });
  }

  readViewMode() {
    return ThemeUtils.storage.get('collection_view');
  }

  setViewMode(mode) {
    var container = document.querySelector('#CollectionProducts .product-cards');
    var viewBtns = document.querySelectorAll('.collection-sort__view-btn[data-view]');
    if (!container) return;

    viewBtns.forEach(function(btn) {
      btn.classList.toggle('collection-sort__view-btn--active', btn.getAttribute('data-view') === mode);
    });

    var listForced = mode === 'list' && this.densityEnabled && this.phoneQuery.matches;
    container.classList.toggle('product-cards--list', mode === 'list' && !listForced);
  }

  /* ── Collapsible filter lists ───────────────────── */

  initCollapsibleLists() {
    var self = this;
    var lists = this.querySelectorAll('.facet-filter__content-list[data-collapse-limit]');

    lists.forEach(function(list) {
      // Skip if already initialized
      if (list.querySelector('.facet-filter__toggle')) return;

      var limit = parseInt(list.getAttribute('data-collapse-limit')) || 5;
      var items = list.querySelectorAll('facet-filter-item');
      if (items.length <= limit) return;

      items.forEach(function(item, i) {
        if (i >= limit) item.classList.add('facet-filter-item--hidden');
      });

      var moreLabel = (list.getAttribute('data-show-more') || '') + ' (' + (items.length - limit) + ')';
      var lessLabel = list.getAttribute('data-show-less') || '';
      var toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'facet-filter__toggle';
      toggleBtn.setAttribute('aria-expanded', 'false');
      var toggleText = document.createElement('span');
      toggleText.className = 'facet-filter__toggle-text';
      toggleText.textContent = moreLabel;
      var toggleIcon = document.createElement('span');
      toggleIcon.className = 'facet-filter__toggle-icon';
      toggleIcon.setAttribute('aria-hidden', 'true');
      toggleIcon.textContent = '+';
      toggleBtn.append(toggleText, toggleIcon);

      toggleBtn.addEventListener('click', function() {
        var expanded = this.getAttribute('aria-expanded') === 'true';
        items.forEach(function(item, i) {
          if (i >= limit) {
            item.classList.toggle('facet-filter-item--hidden', expanded);
          }
        });
        this.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        toggleText.textContent = expanded ? moreLabel : lessLabel;
        toggleIcon.textContent = expanded ? '+' : '\u2212';
      });

      list.appendChild(toggleBtn);
    });
  }

  /* ── Scroll helper ──────────────────────────────── */

  scrollToProducts() {
    var target = document.querySelector('#CollectionProductGrid, .collection-template__products-container');
    if (!target) return;

    var header = document.querySelector('header, .header');
    var offset = 0;
    if (header) {
      var style = window.getComputedStyle(header);
      if (style.position === 'fixed' || style.position === 'sticky') {
        offset = header.offsetHeight;
      }
    }

    var top = target.getBoundingClientRect().top + window.scrollY - offset - 20;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  /* ── Description read more / show less ─────────── */

  bindDescToggle() {
    document.addEventListener('click', function(e) {
      if (!e.target.closest('[data-action="toggle-desc"]')) return;
      var btn = e.target.closest('[data-action="toggle-desc"]');
      var container = btn.closest('[data-desc-toggle]');
      if (!container) return;

      var summary = container.querySelector('.collection-desc__summary');
      var full = container.querySelector('.collection-desc__full');
      var moreSpan = btn.querySelector('.collection-desc__toggle-more');
      var lessSpan = btn.querySelector('.collection-desc__toggle-less');

      if (!full) return;

      var isExpanded = !full.hidden;
      full.hidden = isExpanded;
      if (summary) summary.hidden = !isExpanded;
      if (moreSpan) moreSpan.hidden = !isExpanded;
      if (lessSpan) lessSpan.hidden = isExpanded;
    }, { signal: this.lifecycle.signal });
  }
}


if (!customElements.get('facet-filters')) customElements.define('facet-filters', FacetFilters);


/* ═══════════════════════════════════════════════════
   CollectionBest — Best sellers Swiper carousel
   ═══════════════════════════════════════════════════ */
class CollectionBest extends HTMLElement {
  constructor() {
    super();
    this.swiper = null;
  }

  connectedCallback() {
    var self = this;
    this.waitForSwiper(function() {
      self.initSwiper();
    });
  }

  waitForSwiper(callback) {
    (window.swiperReady || function(cb){ cb(); })(callback, this.querySelector('.collection-best__content'));
  }

  initSwiper() {
    var container = this.querySelector('.collection-best__content');
    if (!container) return;

    var columnsMobile = parseInt(container.getAttribute('data-columns-mobile') || '2', 10);
    var columnsTablet = parseInt(container.getAttribute('data-columns-tablet') || columnsMobile, 10);
    var columnsLaptop = parseInt(container.getAttribute('data-columns-laptop') || columnsTablet, 10);
    var columnsDesktop = parseInt(container.getAttribute('data-columns-desktop') || columnsLaptop, 10);

    this.swiper = new Swiper(container, {
      slidesPerView: Math.min(columnsMobile, 4),
      spaceBetween: 16,
      pagination: {
        el: '.collection-best__content .swiper-pagination',
        clickable: true
      },
      breakpoints: {
        640: { slidesPerView: Math.min(columnsTablet, 4), spaceBetween: 20 },
        1024: { slidesPerView: Math.min(columnsLaptop, 4), spaceBetween: 24 },
        1280: { slidesPerView: Math.min(columnsDesktop, 4), spaceBetween: 24 }
      }
    });
  }
}

if (!customElements.get('collection-best')) customElements.define('collection-best', CollectionBest);

})();
