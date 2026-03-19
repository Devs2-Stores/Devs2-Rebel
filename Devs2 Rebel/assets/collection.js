class FacetFilters extends HTMLElement {
  constructor() {
    super();
    this.searchParamsInitial = window.location.search;
    this.collectionBaseUrl = window.location.pathname;
    this.selectedSortby = null;
    this.selectedViewData = 'filter';
    this.productsPerPage = 20;
    this.currentPage = 1;
    this.currentQuery = null;
    this.operators = {
      and: 'AND',
      or: 'OR',
      not: 'NOT',
      contains: '**',
      equal: '=',
      in: 'in'
    };
    this.paginationBound = false;
    this.fieldOperators = {};
    this.filter = null;
    this.form = null;
    this.inputs = [];
    this.inputsArray = [];
    this.sortSelect = null;
    this.isRestoringFromURL = false;
  }

  connectedCallback() {
    var self = this;
    this.waitForDependencies(function() {
      self.init();
    });
  }

  waitForDependencies(callback) {
    var self = this;
    if (!this._retryCount) this._retryCount = 0;
    if (!this.isConnected) return;
    if (typeof getParameter === 'undefined' || typeof debounce === 'undefined') {
      if (this._retryCount++ < 50) setTimeout(function() {
        self.waitForDependencies(callback);
      }, 100);
      return;
    }
    if (typeof ThemeSearch === 'undefined' || !ThemeSearch.SearchFilter) {
      if (this._retryCount++ < 50) setTimeout(function() {
        self.waitForDependencies(callback);
      }, 100);
      return;
    }
    this.SearchFilter = ThemeSearch.SearchFilter;
    if (this.isConnected) callback();
  }

  init() {
    this.form = this.querySelector('form');
    if (!this.form) return;

    this.inputs = this.form.querySelectorAll("input[type='checkbox']");
    this.inputsArray = Array.from(this.inputs);
    if (this.inputsArray.length === 0) return;

    this.currentPage = parseInt(getParameter(this.searchParamsInitial, 'page')) || 1;
    this.currentQuery = getParameter(this.searchParamsInitial, 'q') || null;

    this.loadFieldOperators();
    this.bindEvents();
    this.bindDrawerEvents();
    this.bindPagination();
    this.initCollapsibleLists();
    this.filter = new this.SearchFilter();
    this.addCollection();

    // Delay filterFromState to ensure all inputs are rendered
    var self = this;
    setTimeout(function() {
      self.filterFromState();
    }, 200);
  }

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

  bindEvents() {
    var self = this;
    this.inputsArray.forEach(function(input) {
      input.addEventListener('change', debounce(function(e) {
        self.handleInputChange(e);
      }, 500));
    });

    // Map native Haravan sort_by values → search API sortby format
    this.SORT_MAP = {
      'title-ascending': '(title:product=asc)',
      'title-descending': '(title:product=desc)',
      'price-ascending': '(price:product=asc)',
      'price-descending': '(price:product=desc)',
      'created-descending': '(updated_at:product=desc)',
      'created-ascending': '(updated_at:product=asc)'
    };

    this.sortSelect = document.querySelector('#SortBy, .collection-sort__select, #shopSortSelect');
    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', function(e) {
        var nativeValue = e.target.value || ''; // e.g. "title-ascending"
        self.selectedSortby = self.SORT_MAP[nativeValue] || null; // search API format
        self.currentPage = 1;

        var hasActiveFilters = self.inputsArray.some(function(input) {
          return input.checked;
        });
        if (!hasActiveFilters) {
          // No filters → redirect to native collection URL
          var url = self.collectionBaseUrl;
          if (nativeValue) url += '?sort_by=' + nativeValue;
          window.location.href = url;
          return;
        }
        // Filters active → use search API with sortby param
        self.applyFilter();
      });

      // Restore sort select from URL on page load (native collection `?sort_by=` param)
      var urlSortBy = getParameter(this.searchParamsInitial, 'sort_by');
      if (urlSortBy && this.sortSelect) {
        this.sortSelect.value = urlSortBy;
        this.selectedSortby = this.SORT_MAP[urlSortBy] || null;
      }
      // Also handle search API sortby (when filters + sort are both active)
      var urlSortby = getParameter(this.searchParamsInitial, 'sortby');
      if (urlSortby && this.sortSelect) {
        // Find which native key maps to this search API value
        var nativeKey = Object.keys(this.SORT_MAP || {}).find(function(k) {
          return self.SORT_MAP[k] === urlSortby;
        });
        if (nativeKey) this.sortSelect.value = nativeKey;
        this.selectedSortby = urlSortby;
      }
    }

    var viewBtns = document.querySelectorAll('.collection-sort__view-btn');
    if (viewBtns.length > 0) {
      var savedView = localStorage.getItem('collection_view') || 'grid';
      self.setViewMode(savedView);

      viewBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          var viewMode = this.getAttribute('data-view');
          self.setViewMode(viewMode);
          localStorage.setItem('collection_view', viewMode);
        });
      });
    }
  }

  setViewMode(mode) {
    var productsContainer = document.querySelector('.product-cards, .collection-template__products');
    var viewBtns = document.querySelectorAll('.collection-sort__view-btn');

    if (!productsContainer) return;

    viewBtns.forEach(function(btn) {
      if (btn.getAttribute('data-view') === mode) {
        btn.classList.add('collection-sort__view-btn--active');
      } else {
        btn.classList.remove('collection-sort__view-btn--active');
      }
    });

    if (mode === 'list') {
      productsContainer.classList.add('product-cards--list');
    } else {
      productsContainer.classList.remove('product-cards--list');
    }
  }

  loadFieldOperators() {
    var self = this;
    var facetFilters = this.querySelectorAll('facet-filter[data-operator]');
    facetFilters.forEach(function(facet) {
      var operator = facet.getAttribute('data-operator') || 'OR';
      var inputs = facet.querySelectorAll("input[type='checkbox']");
      inputs.forEach(function(input) {
        if (input.name) {
          self.fieldOperators[input.name] = operator.toUpperCase();
        }
      });
    });
  }

  getOperatorForField(fieldName) {
    return this.fieldOperators[fieldName] || 'OR';
  }

  initCollapsibleLists() {
    var lists = this.querySelectorAll('.facet-filter__content-list[data-collapse-limit]');
    lists.forEach(function(list) {
      var limit = parseInt(list.getAttribute('data-collapse-limit')) || 5;
      var items = list.querySelectorAll('facet-filter-item');
      if (items.length <= limit) return;

      items.forEach(function(item, index) {
        if (index >= limit) {
          item.classList.add('facet-filter-item--hidden');
        }
      });

      var toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'facet-filter__toggle';
      toggleBtn.setAttribute('data-expanded', 'false');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.innerHTML = '<span class="facet-filter__toggle-text">Xem thêm (' + (items.length - limit) + ')</span><span class="facet-filter__toggle-icon">+</span>';

      toggleBtn.addEventListener('click', function() {
        var isExpanded = this.getAttribute('data-expanded') === 'true';
        items.forEach(function(item, index) {
          if (index >= limit) {
            if (isExpanded) {
              item.classList.add('facet-filter-item--hidden');
            } else {
              item.classList.remove('facet-filter-item--hidden');
            }
          }
        });
        if (isExpanded) {
          this.setAttribute('data-expanded', 'false');
          this.setAttribute('aria-expanded', 'false');
          this.innerHTML = '<span class="facet-filter__toggle-text">Xem thêm (' + (items.length - limit) + ')</span><span class="facet-filter__toggle-icon">+</span>';
        } else {
          this.setAttribute('data-expanded', 'true');
          this.setAttribute('aria-expanded', 'true');
          this.innerHTML = '<span class="facet-filter__toggle-text">Thu gọn</span><span class="facet-filter__toggle-icon">−</span>';
        }
      });
      list.appendChild(toggleBtn);
    });
  }

  bindPagination() {
    if (this.paginationBound) return;
    this.paginationBound = true;
    var self = this;
    document.addEventListener('click', function(e) {
      var paginationLink = e.target.closest('.section-pagination a');
      if (!paginationLink) return;

      var hasActiveFilters = self.inputsArray.some(function(input) {
        return input.checked;
      });
      if (!hasActiveFilters) return;

      e.preventDefault();
      var pageNum = null;
      var dataPage = paginationLink.getAttribute('data-page');
      if (dataPage) pageNum = parseInt(dataPage);
      if (!pageNum || isNaN(pageNum)) {
        var href = paginationLink.getAttribute('href');
        if (href) {
          var pageMatch = href.match(/[?&]page=(\d+)/);
          if (pageMatch) pageNum = parseInt(pageMatch[1]);
        }
      }
      if (pageNum && !isNaN(pageNum) && pageNum > 0) {
        self.currentPage = pageNum;
        self.applyFilter();
        self.scrollToProducts();
      }
    });
  }

  handleInputChange(e) {
    var name = e.target.name;
    var value = e.target.value;
    var checked = e.target.checked;
    if (!name || !value) return;

    this.currentPage = 1;
    var operator = this.getOperatorForField(name);

    if (checked) {
      this.filter.addValue(name, name, value, operator);
    } else {
      this.filter.deleteValue(name, name, value, operator);
    }

    var hasActiveFilters = this.inputsArray.some(function(input) {
      return input.checked;
    });
    if (!hasActiveFilters) {
      // Xóa hết filter → quay về collection gốc thay vì gọi search với q rỗng
      this.filter = new this.SearchFilter();
      this.restoreCollection();
      return;
    }
    this.applyFilter();
    this.scrollToProducts();
  }

  restoreCollection() {
    var self = this;
    var url = this.collectionBaseUrl + '?view=filter';
    if (this.selectedSortby) url += '&sortby=' + this.selectedSortby;
    fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html'
        }
      })
      .then(function(response) {
        if (!response.ok) throw new Error('Network error');
        return response.text();
      })
      .then(function(html) {
        window.history.pushState({
          turbolinks: true,
          url: self.collectionBaseUrl
        }, null, self.collectionBaseUrl);
        self.refreshUI(html);
        self.scrollToProducts();
      })
      .catch(function(err) {
        console.error('FacetFilters: restoreCollection error', err);
      });
  }

  scrollToProducts() {
    var target = document.querySelector('.collection-template__products-container') ||
      document.querySelector('.product-cards') ||
      document.querySelector('.collection-template__products');
    if (target) {
      var header = document.querySelector('header') || document.querySelector('.header');
      var headerHeight = 0;
      if (header) {
        var headerStyle = window.getComputedStyle(header);
        if (headerStyle.position === 'fixed' || headerStyle.position === 'sticky') {
          headerHeight = header.offsetHeight;
        }
      }
      var targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
      window.scrollTo({
        top: targetTop,
        behavior: 'smooth'
      });
    }
  }

  addCollection() {
    if (typeof themeConfig === 'undefined' || !themeConfig.collection || !themeConfig.collection.id) return;
    // Haravan filter: (collectionid:product>=ID)
    this.filter.addValue('collectionid', 'collectionid', themeConfig.collection.id, this.operators.and);
  }

  applyFilter() {
    if (!this.filter) return;
    var self = this;
    this.filter.search({
      view: this.selectedViewData,
      page: this.currentPage,
      sortby: this.selectedSortby,
      success: function(data) {
        if (!data) return;
        self.pushState({
          sortby: self.selectedSortby,
          page: self.currentPage
        });
        self.refreshUI(data);
      },
      error: function(xhr, status, error) {
        console.error('FacetFilters: Search error', error);
      }
    });
  }

  pushState(options) {
    if (this.isRestoringFromURL) return;
    options = options || {};
    if (!this.filter) return;
    try {
      var _urlToPush = this.filter.buildSearchUrl(options);
      var urlToPush = _urlToPush.slice(_urlToPush.indexOf('?'));
      window.history.pushState({
        turbolinks: true,
        url: urlToPush
      }, null, urlToPush);
    } catch (e) {}
  }

  refreshUI(data) {
    if (!data || typeof data !== 'string') return;
    var productsContainer = document.querySelector('.collection-template__products');
    if (!productsContainer) return;

    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = data.trim();

    var responseProductCards = tempDiv.querySelector('.product-cards, ul.collection-template__products');

    if (responseProductCards) {
      if (productsContainer.tagName === 'UL') {
        productsContainer.innerHTML = responseProductCards.innerHTML;
      } else {
        productsContainer.innerHTML = '';
        productsContainer.appendChild(responseProductCards.cloneNode(true));
      }
    } else {
      productsContainer.innerHTML = '<div class="collection-template__no-products"><p>Không tìm thấy sản phẩm phù hợp.</p></div>';
    }

    var paginationContainer = document.querySelector('.collection-template__pagination');
    if (paginationContainer) {
      var responsePagination = tempDiv.querySelector('.section-pagination, .collection-template__pagination');
      if (responsePagination) {
        paginationContainer.innerHTML = responsePagination.innerHTML;
        paginationContainer.style.display = '';
      } else {
        paginationContainer.style.display = 'none';
      }
    }

    var countText = document.querySelector('.collection-sort__count-text');
    if (countText) {
      var productItems = document.querySelectorAll('.product-cards__item, .collection-template__products li');
      var currentCount = productItems.length;

      // Parse total count from response
      var totalCount = currentCount;

      // If there's pagination, calculate total from last page number
      var responsePagination = tempDiv.querySelector('.section-pagination');
      if (responsePagination) {
        var paginationLinks = responsePagination.querySelectorAll('a[data-page]');
        var maxPage = 1;
        paginationLinks.forEach(function(link) {
          var page = parseInt(link.getAttribute('data-page'));
          if (page > maxPage) maxPage = page;
        });

        // Use stored productsPerPage, fallback to current count if on page 1
        var perPage = this.productsPerPage || currentCount;

        // If on page 1, update stored perPage
        if (this.currentPage === 1 && currentCount > 0) {
          this.productsPerPage = currentCount;
          perPage = currentCount;
        }

        // Calculate total: (maxPage - 1) * perPage + products on last page
        // Since we don't know last page count, estimate as maxPage * perPage
        totalCount = maxPage * perPage;
      }

      if (currentCount > 0) {
        countText.innerHTML = 'Hiển thị <b>' + currentCount + '</b> / ' + totalCount + ' sản phẩm';
      } else {
        countText.innerHTML = 'Không có sản phẩm';
      }
    }

    document.dispatchEvent(new CustomEvent('collection:filtered', {
      detail: {
        data: data,
        container: productsContainer
      }
    }));
  }

  filterFromState(retryCount) {
    retryCount = retryCount || 0;
    var urlPage = parseInt(getParameter(this.searchParamsInitial, 'page'));
    if (urlPage && !isNaN(urlPage) && urlPage > 0) this.currentPage = urlPage;
    if (!this.currentQuery || !this.currentQuery.trim()) return;

    try {
      var self = this;
      var query = this.currentQuery.trim();
      var foundAnyInput = false;

      // ── Haravan filter format ────────────────────────────────────
      // Decoded: filter=(collectionid:product>=0)&&((vendor:product=V1)||(vendor:product=V2))&&(price_variant:product range min_max)
      if (query.indexOf('filter=') === 0) {
        query = query.substring('filter='.length);

        // Split by && (decoded by getParameter → actual && chars)
        var segments = query.split('&&');

        segments.forEach(function(seg) {
          seg = seg.trim();
          if (!seg) return;

          // Skip collection segment: (collectionid:product>=...)
          if (/^\(collectionid:product>=/i.test(seg)) return;

          // Price range: (price_variant:product range min_max)
          var priceMatch = seg.match(/^\(price_variant:product range (\d+_\d+)\)$/i);
          if (priceMatch) {
            var rangeValue = priceMatch[1];
            var priceInput = self.inputsArray.find(function(input) {
              return input.name === 'price_variant' && String(input.value) === rangeValue;
            });
            if (priceInput && !priceInput.checked) {
              priceInput.checked = true;
              foundAnyInput = true;
              var priceOp = self.getOperatorForField('price_variant');
              self.filter.addValue('price_variant', 'price_variant', rangeValue, priceOp);
            }
            return;
          }

          // Regular fields: ((field:product=v1)||(field:product=v2))
          // Strip the single outermost parens
          var inner = seg.replace(/^\((.+)\)$/, '$1');
          var items = inner.split('||');
          items.forEach(function(item) {
            item = item.trim().replace(/^\((.+)\)$/, '$1');
            // Parse "fieldname:product=value"
            var m = item.match(/^([^:]+):product=(.*)$/i);
            if (!m) return;
            var fieldName = m[1].trim();
            var fieldValue = m[2].trim();

            var targetInput = self.inputsArray.find(function(input) {
              return input.name === fieldName && String(input.value) === fieldValue;
            });
            if (targetInput && !targetInput.checked) {
              targetInput.checked = true;
              foundAnyInput = true;
              var op = self.getOperatorForField(fieldName);
              self.filter.addValue(fieldName, fieldName, fieldValue, op);
            }
          });
        });

        // ── Legacy / fallback format ──────────────────────────────────
      } else {
        var groups = query.split(this.operators.and);
        groups.forEach(function(group) {
          group = group.trim();
          if (!group.includes(':')) return;
          var colonIndex = group.indexOf(':');
          var name = group.substring(0, colonIndex).trim();
          var fieldsStr = group.substring(colonIndex + 1).trim();
          var operator = self.getOperatorForField(name);
          var splitOperator = operator === 'AND' ? ' AND ' : ' OR ';
          fieldsStr = fieldsStr.replace(/^\((.+)\)$/, '$1');
          var fields = fieldsStr.split(splitOperator).map(function(s) {
            return s.trim().replace(/^\((.+)\)$/, '$1');
          }).filter(function(s) {
            return s;
          });
          fields.forEach(function(field) {
            var fieldNormalized = field.trim();
            var targetInput = self.inputsArray.find(function(input) {
              return input && input.name === name && String(input.value) === fieldNormalized;
            });
            if (targetInput && !targetInput.checked) {
              foundAnyInput = true;
              targetInput.checked = true;
              self.filter.addValue(name, name, targetInput.value, operator);
            }
          });
        });
      }

      // Retry if no inputs found yet (DOM may not be ready)
      if (!foundAnyInput && retryCount < 3) {
        setTimeout(function() {
          self.filterFromState(retryCount + 1);
        }, 200);
        return;
      }

      if (this.filter && Object.keys(this.filter.fields || {}).length > 0) {
        this.isRestoringFromURL = true;
        var self = this;
        setTimeout(function() {
          self.applyFilter();
          setTimeout(function() {
            self.isRestoringFromURL = false;
          }, 500);
        }, 100);
      }

    } catch (e) {
      console.error('filterFromState error:', e);
    }
  }
}
customElements.define('facet-filters', FacetFilters);

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

  waitForSwiper(callback, retries) {
    var self = this;
    if (typeof retries === 'undefined') retries = 0;
    if (typeof Swiper === 'undefined') {
      if (retries >= 50) {
        console.warn('Swiper not loaded after 5s');
        return;
      }
      setTimeout(function() {
        self.waitForSwiper(callback, retries + 1);
      }, 100);
      return;
    }
    callback();
  }

  initSwiper() {
    var container = this.querySelector('.collection-best__content');
    if (!container) return;

    this.swiper = new Swiper(container, {
      slidesPerView: 2,
      spaceBetween: 10,
      pagination: {
        el: '.collection-best__content .swiper-pagination',
        clickable: true
      },
      breakpoints: {
        640: {
          slidesPerView: 3,
          spaceBetween: 15
        },
        1024: {
          slidesPerView: 4,
          spaceBetween: 20
        },
        1280: {
          slidesPerView: 5,
          spaceBetween: 20
        }
      }
    });
  }
}
customElements.define('collection-best', CollectionBest);