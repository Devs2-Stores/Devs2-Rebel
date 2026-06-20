(function() {
'use strict';

function formatPriceNumber(value) {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * collection.js — Shopify Native Storefront Filtering
 *
 * Uses Shopify Section Rendering API for AJAX filtering, sorting, and pagination.
 * Replaces the old Haravan-based ThemeSearch.SearchFilter system.
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
    this.sortSelect = this.querySelector('#SortBy, .collection-sort__select');

    this.debouncedSubmit = debounce(this.submitFilters.bind(this), 500);

    this.paginationType = this.dataset.paginationType || 'pagination';
    this.filterLayout = this.dataset.filterLayout || 'sidebar';

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
    this.bindCompare();
    this.bindDescToggle();
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
      }, 800));
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
      }, 700);

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

  submitFilters() {
    var searchParams = this.buildSearchParams();
    var url = this.collectionUrl + '?' + searchParams.toString();
    this.fetchAndRender(url);
  }

  buildSearchParams() {
    var params = new URLSearchParams();

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
    if (!this.sortSelect) return;
    var self = this;

    this.sortSelect.addEventListener('change', function() {
      var searchParams = self.buildSearchParams();
      searchParams.set('sort_by', this.value);
      var url = self.collectionUrl + '?' + searchParams.toString();
      self.fetchAndRender(url);
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

      var url = self.collectionUrl + '?' + searchParams.toString();
      self.fetchAndRender(url);
      self.scrollToProducts();
    });
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

  fetchAndRender(url) {
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
      window.history.pushState({}, '', cleanUrl.toString());

      self.classList.remove('is-loading');

      // Re-emit event
      document.dispatchEvent(new CustomEvent('collection:filtered'));
    })
    .catch(function(err) {
      if (err.name === 'AbortError') return;
      self.classList.remove('is-loading');
    });
  }

  renderSectionResponse(html) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, 'text/html');

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

    // Replace filters (to update counts & active states)
    var newFilters = doc.querySelector('#FacetFiltersContainer');
    var currentFilters = document.querySelector('#FacetFiltersContainer');
    if (newFilters && currentFilters) {
      currentFilters.innerHTML = newFilters.innerHTML;
      // Re-init collapsible lists and events on new filter HTML
      this.reinitFilters();
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

    // Update mobile filter badge
    var newBadge = doc.querySelector('.collection-template__filter-badge');
    var currentBadgeContainer = document.querySelector('.collection-template__filter-btn');
    var currentBadge = document.querySelector('.collection-template__filter-badge');
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

    // Re-apply view mode
    var savedView = localStorage.getItem('collection_view') || 'grid';
    this.setViewMode(savedView);
  }

  reinitFilters() {
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
  }

  /* ── Filter drawer (mobile) ─────────────────────── */

  bindDrawerEvents() {
    var openBtn = document.querySelector('[data-action="open-filter"]');
    var closeBtns = document.querySelectorAll('[data-action="close-filter"]');
    var drawer = document.getElementById('CollectionFilterDrawer');
    var body = document.body;

    if (openBtn && drawer) {
      openBtn.addEventListener('click', function() {
        drawer.classList.add('is-open');
        var overlay = document.querySelector('.collection-template__filter-overlay');
        if (overlay) overlay.classList.add('is-visible');
        body.style.overflow = 'hidden';
      });
    }

    if (closeBtns.length > 0 && drawer) {
      closeBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          drawer.classList.remove('is-open');
          var overlay = document.querySelector('.collection-template__filter-overlay');
          if (overlay) overlay.classList.remove('is-visible');
          body.style.overflow = '';
        });
      });
    }
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
    });
  }

  fetchAppendProducts(url, triggerEl) {
    var self = this;
    var sectionUrl = url + (url.indexOf('?') > -1 ? '&' : '?') + 'sections=' + this.sectionId;

    fetch(sectionUrl)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var html = data[self.sectionId];
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');

        // Append new product cards
        var newItems = doc.querySelectorAll('.product-cards__item');
        var productList = self.querySelector('.product-cards');
        if (productList && newItems.length > 0) {
          newItems.forEach(function(item) {
            productList.appendChild(item);
          });
        }

        // Update pagination area
        var newPagination = doc.querySelector('#CollectionPagination');
        var currentPagination = self.querySelector('#CollectionPagination');
        if (currentPagination && newPagination) {
          currentPagination.innerHTML = newPagination.innerHTML;
        }

        // Re-bind events for new content
        if (self.paginationType === 'load_more') {
          // New load-more button is already wired via event delegation
        }
        if (self.paginationType === 'infinite') {
          self.observeInfiniteSentinel();
        }
      })
      .catch(function(err) {
        if (triggerEl) {
          triggerEl.disabled = false;
          triggerEl.classList.remove('is-loading');
        }
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

    var body = document.body;

    // Open modal — from mobile filter button or sort toolbar filter button
    var openBtns = document.querySelectorAll('[data-action="open-filter"], [data-action="open-filter-modal"]');
    openBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        body.style.overflow = 'hidden';
      });
    });

    // Close modal
    var closeBtns = modal.querySelectorAll('[data-action="close-filter-modal"]');
    closeBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        body.style.overflow = '';
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        body.style.overflow = '';
      }
    });
  }

  /* ── View toggle (grid/list) ────────────────────── */

  bindViewToggle() {
    var self = this;
    var viewBtns = document.querySelectorAll('.collection-sort__view-btn');
    if (viewBtns.length === 0) return;

    var mainContainer = document.getElementById('CollectionMain');
    var defaultView = (mainContainer && mainContainer.dataset.defaultView) || 'grid';
    var savedView = localStorage.getItem('collection_view') || defaultView;
    this.setViewMode(savedView);

    viewBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var mode = this.getAttribute('data-view');
        self.setViewMode(mode);
        localStorage.setItem('collection_view', mode);
      });
    });
  }

  setViewMode(mode) {
    var container = document.querySelector('#CollectionProducts .product-cards');
    var viewBtns = document.querySelectorAll('.collection-sort__view-btn');
    if (!container) return;

    viewBtns.forEach(function(btn) {
      btn.classList.toggle('collection-sort__view-btn--active', btn.getAttribute('data-view') === mode);
    });

    if (mode === 'list') {
      container.classList.add('product-cards--list');
    } else {
      container.classList.remove('product-cards--list');
    }
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

      var toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'facet-filter__toggle';
      toggleBtn.setAttribute('aria-expanded', 'false');
      var extraCount = items.length - limit;
      toggleBtn.innerHTML = '<span class="facet-filter__toggle-text">Show more (' + extraCount + ')</span><span class="facet-filter__toggle-icon">+</span>';

      toggleBtn.addEventListener('click', function() {
        var expanded = this.getAttribute('aria-expanded') === 'true';
        items.forEach(function(item, i) {
          if (i >= limit) {
            item.classList.toggle('facet-filter-item--hidden', expanded);
          }
        });
        if (expanded) {
          this.setAttribute('aria-expanded', 'false');
          this.innerHTML = '<span class="facet-filter__toggle-text">Show more (' + extraCount + ')</span><span class="facet-filter__toggle-icon">+</span>';
        } else {
          this.setAttribute('aria-expanded', 'true');
          this.innerHTML = '<span class="facet-filter__toggle-text">Show less</span><span class="facet-filter__toggle-icon">âˆ’</span>';
        }
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

  /* ── Compare products ─────────────────────────── */

  bindCompare() {
    var self = this;
    this.compareItems = [];
    this.compareMax = 5;
    this.compareMode = false;

    var toggleBtn = document.querySelector('[data-action="toggle-compare"]');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function() {
        self.compareMode = !self.compareMode;
        this.classList.toggle('is-active', self.compareMode);
        var productsContainer = document.getElementById('CollectionProducts');
        if (productsContainer) {
          productsContainer.classList.toggle('compare-mode', self.compareMode);
        }
        if (!self.compareMode) {
          self.clearCompare();
        }
      });
    }

    /* Delegate checkbox changes */
    document.addEventListener('change', function(e) {
      if (!e.target.matches('.product-card__compare-input')) return;
      var cb = e.target;
      var id = cb.dataset.compareId;

      if (cb.checked) {
        if (self.compareItems.length >= self.compareMax) {
          cb.checked = false;
          return;
        }
        self.compareItems.push({
          id: id,
          title: cb.dataset.compareTitle,
          image: cb.dataset.compareImage,
          price: cb.dataset.comparePrice,
          url: cb.dataset.compareUrl
        });
      } else {
        self.compareItems = self.compareItems.filter(function(item) { return item.id !== id; });
      }
      self.updateCompareBar();
    });

    /* Clear button */
    var clearBtn = document.querySelector('[data-action="clear-compare"]');
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        self.clearCompare();
      });
    }

    /* Compare button — open compare page/popup */
    var compareBtn = document.getElementById('CompareBtn');
    if (compareBtn) {
      compareBtn.addEventListener('click', function() {
        if (self.compareItems.length < 2) return;
        var ids = self.compareItems.map(function(item) { return item.id; }).join(',');
        /* Store in sessionStorage for compare page to read */
        sessionStorage.setItem('compare_products', JSON.stringify(self.compareItems));
        window.location.href = ((themeConfig.routes && themeConfig.routes.root_url) || '/') + 'pages/compare?ids=' + ids;
      });
    }
  }

  updateCompareBar() {
    var bar = document.getElementById('CompareBar');
    var slots = document.querySelectorAll('.compare-bar__slot');
    var countEl = document.querySelector('[data-compare-count]');
    var compareBtn = document.getElementById('CompareBtn');

    if (!bar) return;

    /* Show/hide bar */
    bar.classList.toggle('is-visible', this.compareItems.length > 0);

    /* Update counter */
    if (countEl) countEl.textContent = this.compareItems.length;

    /* Enable compare btn if >= 2 items */
    if (compareBtn) compareBtn.disabled = this.compareItems.length < 2;

    /* Update slots */
    slots.forEach(function(slot, index) {
      slot.innerHTML = '';
      slot.classList.remove('is-filled');
      if (this.compareItems[index]) {
        var item = this.compareItems[index];
        slot.classList.add('is-filled');
        var img = document.createElement('img');
        img.src = item.image;
        img.alt = item.title;
        img.width = 52;
        img.height = 52;
        slot.appendChild(img);

        var removeBtn = document.createElement('button');
        removeBtn.className = 'compare-bar__slot-remove';
        removeBtn.innerHTML = '×';
        removeBtn.type = 'button';
        removeBtn.dataset.removeId = item.id;
        removeBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          this.removeCompareItem(item.id);
        }.bind(this));
        slot.appendChild(removeBtn);
      }
    }.bind(this));
  }

  removeCompareItem(id) {
    this.compareItems = this.compareItems.filter(function(item) { return item.id !== id; });
    /* Uncheck the checkbox */
    var cb = document.querySelector('.product-card__compare-input[data-compare-id="' + id + '"]');
    if (cb) cb.checked = false;
    this.updateCompareBar();
  }

  clearCompare() {
    this.compareItems = [];
    var checkboxes = document.querySelectorAll('.product-card__compare-input:checked');
    checkboxes.forEach(function(cb) { cb.checked = false; });
    this.updateCompareBar();
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
    });
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
    (window.swiperReady || function(cb){ cb(); })(callback);
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
      spaceBetween: 10,
      pagination: {
        el: '.collection-best__content .swiper-pagination',
        clickable: true
      },
      breakpoints: {
        640: { slidesPerView: Math.min(columnsTablet, 4), spaceBetween: 15 },
        1024: { slidesPerView: Math.min(columnsLaptop, 4), spaceBetween: 20 },
        1280: { slidesPerView: Math.min(columnsDesktop, 4), spaceBetween: 20 }
      }
    });
  }
}

if (!customElements.get('collection-best')) customElements.define('collection-best', CollectionBest);

})();
