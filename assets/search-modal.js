/* -------------------------------------------------------------------------- */
/*                                SEARCH MODAL                                */
/* -------------------------------------------------------------------------- */

class SearchModal extends HTMLElement {
  constructor() {
    super();
    this.searchTimeout = null;
    this.debounceDelay = 300;
    this.searchController = null;
    this.searchRequestId = 0;
  }

  connectedCallback() {
    this.input = this.querySelector('.search-modal-input');
    this.resultsContainer = this.querySelector('.search-modal-results-content');
    this.loadingEl = this.querySelector('.search-modal-loading');
    this.form = this.querySelector('.search-modal-form');
    this.clearButton = this.querySelector('.search-modal-clear');
    this.initialResultsMarkup = this.resultsContainer ? this.resultsContainer.innerHTML : '';
    this.bindEvents();
  }

  disconnectedCallback() {
    if (this._boundClickHandler) document.removeEventListener('click', this._boundClickHandler);
    if (this._boundEscHandler) document.removeEventListener('keydown', this._boundEscHandler);
  }

  bindEvents() {
    var self = this;

    this._boundClickHandler = function(e) {
      var openTrigger = e.target.closest('[data-action="open-search-modal"]');
      var closeTrigger = e.target.closest('[data-action="close-search-modal"]');
      var overlay = e.target.closest('.search-modal-overlay');

      if (openTrigger) {
        e.preventDefault();
        self.open();
      }
      if (closeTrigger || overlay) self.close();
    };
    document.addEventListener('click', this._boundClickHandler);

    this._boundEscHandler = function(e) {
      if (e.key === 'Escape' && self.isOpen()) self.close();
    };
    document.addEventListener('keydown', this._boundEscHandler);

    if (this.input) {
      this.input.addEventListener('input', function(e) {
        self.updateClearButton(e.target.value);
        self.handleSearch(e.target.value);
      });

      // Keyboard navigation for predictive results
      this.input.addEventListener('keydown', function(e) {
        self.handleKeydown(e);
      });

      if (this.form) {
        this.form.addEventListener('submit', function(e) {
          if (self.input.value.trim().length === 0) e.preventDefault();
        });
      }
    }

    if (this.clearButton) {
      this.clearButton.addEventListener('click', function() {
        self.clearSearch();
      });
    }
  }

  /**
   * Get locale-aware root URL
   */
  getRootUrl() {
    if (typeof themeConfig !== 'undefined' && themeConfig.routes && themeConfig.routes.root_url) {
      return themeConfig.routes.root_url;
    }
    return (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) ? window.Shopify.routes.root : '/';
  }

  /**
   * Check if predictive search is enabled
   */
  isPredictiveEnabled() {
    return typeof themeConfig !== 'undefined' && themeConfig.routes && themeConfig.routes.predictive_search_url;
  }

  open() {
    var self = this;
    this.classList.add('show');
    setTimeout(function() {
      if (self.input) self.input.focus();
    }, 100);
    ThemeUtils.lockScroll();
    ThemeUtils.trapFocus(this);
  }

  close() {
    this.classList.remove('show');
    if (this.input) {
      this.input.value = '';
      this.input.setAttribute('aria-expanded', 'false');
    }
    this.updateClearButton('');
    this.clearResults();
    ThemeUtils.unlockScroll();
    ThemeUtils.releaseFocus(this);
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }
    if (this.searchController) {
      this.searchController.abort();
      this.searchController = null;
    }
    this.searchRequestId += 1;
  }

  isOpen() {
    return this.classList.contains('show');
  }

  handleSearch(query) {
    var self = this;
    var trimmedQuery = query.trim();
    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    if (trimmedQuery.length < 2) {
      this.clearResults();
      return;
    }

    this.searchTimeout = setTimeout(function() {
      self.performSearch(trimmedQuery);
    }, this.debounceDelay);
  }

  updateClearButton(value) {
    if (!this.clearButton) return;
    this.clearButton.classList.toggle('hidden', value.length === 0);
  }

  clearSearch() {
    if (!this.input) return;
    this.input.value = '';
    this.input.setAttribute('aria-expanded', 'false');
    this.updateClearButton('');
    this.clearResults();
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }
    if (this.searchController) {
      this.searchController.abort();
      this.searchController = null;
    }
    this.searchRequestId += 1;
    this.input.focus();
  }

  performSearch(query) {
    var self = this;
    if (!this.resultsContainer) return;
    this.showLoading();

    if (this.searchController) {
      this.searchController.abort();
    }
    var requestId = ++this.searchRequestId;
    var controller = new AbortController();
    this.searchController = controller;

    var fetchUrl;
    if (this.isPredictiveEnabled()) {
      // Use Predictive Search API with Section Rendering
      var params = new URLSearchParams({
        'q': query,
        'section_id': 'predictive-search',
        'resources[type]': 'product,collection,article,page,query',
        'resources[limit]': '6',
        'resources[options][unavailable_products]': 'last'
      });
      fetchUrl = this.getRootUrl() + 'search/suggest?' + params.toString();
    } else {
      this.displayFallbackSearchLink(query);
      this.hideLoading();
      if (this.searchController === controller) this.searchController = null;
      return;
    }

    fetch(fetchUrl, { signal: controller.signal })
      .then(function(response) {
        if (!response.ok) throw new Error('Search request failed');
        return response.text();
      })
      .then(function(html) {
        if (requestId !== self.searchRequestId || self.searchController !== controller) return;
        self.displayResults(html);
      })
      .catch(function(error) {
        if (error.name === 'AbortError') return;
        if (requestId !== self.searchRequestId || self.searchController !== controller) return;
        var errorMsg = (typeof themeConfig !== 'undefined' && themeConfig.strings && themeConfig.strings.cart)
          ? (themeConfig.strings.cart.error || 'An error occurred. Please try again.')
          : 'An error occurred. Please try again.';
        self.displayError(errorMsg);
      })
      .finally(function() {
        if (requestId !== self.searchRequestId || self.searchController !== controller) return;
        self.hideLoading();
        self.searchController = null;
      });
  }

  displayResults(html) {
    var self = this;
    if (!this.resultsContainer) return;

    if (this.isPredictiveEnabled()) {
      // Parse Section Rendering response
      var parser = new DOMParser();
      var doc = parser.parseFromString(html, 'text/html');
      var newResults = doc.querySelector('#predictive-search-results');
      if (newResults) {
        this.resultsContainer.innerHTML = newResults.outerHTML;
      } else {
        this.resultsContainer.innerHTML = html;
      }
    } else {
      this.resultsContainer.innerHTML = html;
    }

    // Set aria-expanded
    if (this.input) {
      this.input.setAttribute('aria-expanded', 'true');
    }

    this.setupResultTabs();

    // Close modal on result click
    this.resultsContainer.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        self.close();
      });
    });
  }

  displayError(message) {
    if (!this.resultsContainer) return;
    this.resultsContainer.innerHTML = '<div class="search-modal-error"><p>' + ThemeUtils.escapeHtml(message) + '</p></div>';
  }

  displayFallbackSearchLink(query) {
    if (!this.resultsContainer) return;
    var searchUrl = this.getRootUrl() + 'search?type=product&q=' + encodeURIComponent(query);
    this.resultsContainer.innerHTML = '<div class="search-modal-empty"><p>' + ThemeUtils.escapeHtml(this.dataset.fallback || 'Search suggestions are unavailable.') + '</p><a href="' + ThemeUtils.escapeHtml(searchUrl) + '">' + ThemeUtils.escapeHtml(this.dataset.fallbackLink || 'View search results') + '</a></div>';
    if (this.input) this.input.setAttribute('aria-expanded', 'true');
  }

  clearResults() {
    if (!this.resultsContainer) return;
    this.resultsContainer.innerHTML = this.initialResultsMarkup;
  }

  setupResultTabs() {
    var self = this;
    var root = this.resultsContainer && this.resultsContainer.querySelector('#predictive-search-results');
    if (!root || root.querySelector('.predictive-search__tabs')) return;
    var groups = Array.from(root.querySelectorAll('[data-search-group]'));
    if (!groups.length) return;
    var tabs = [
      { key: 'products', label: this.dataset.tabProducts || 'Products' },
      { key: 'articles', label: this.dataset.tabArticles || 'Articles' },
      { key: 'pages', label: this.dataset.tabPages || 'Pages' }
    ];
    var hasCategoryResults = tabs.some(function(tab) {
      return groups.some(function(group) { return group.dataset.searchGroup === tab.key; });
    });
    if (!hasCategoryResults) return;
    root.classList.add('predictive-search-results--tabbed');
    var suggestions = groups.filter(function(group) { return group.dataset.searchGroup === 'suggestions'; });
    var tablist = document.createElement('div');
    tablist.className = 'predictive-search__tabs';
    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-label', this.dataset.tabsLabel || 'Search result categories');
    var panels = document.createElement('div');
    panels.className = 'predictive-search__tab-panels';
    var selectedKey = null;
    tabs.forEach(function(tab) {
      var matchingGroups = groups.filter(function(group) { return group.dataset.searchGroup === tab.key; });
      if (!matchingGroups.length) return;
      var panel = document.createElement('div');
      panel.className = 'predictive-search__tab-panel';
      panel.id = 'search-panel-' + tab.key;
      panel.dataset.searchPanel = tab.key;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', 'search-tab-' + tab.key);
      matchingGroups.forEach(function(group) { panel.appendChild(group); });
      panels.appendChild(panel);
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'predictive-search__tab';
      button.id = 'search-tab-' + tab.key;
      button.dataset.searchTab = tab.key;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', 'search-panel-' + tab.key);
      button.setAttribute('aria-selected', selectedKey === null ? 'true' : 'false');
      button.tabIndex = selectedKey === null ? 0 : -1;
      button.textContent = tab.label;
      button.addEventListener('click', function() { self.activateSearchTab(tab.key); });
      button.addEventListener('keydown', self.handleTabKeydown.bind(self));
      tablist.appendChild(button);
      if (selectedKey === null) selectedKey = tab.key;
    });
    if (suggestions.length) {
      suggestions[suggestions.length - 1].after(tablist);
      tablist.after(panels);
    } else {
      root.insertBefore(tablist, root.firstChild);
      root.insertBefore(panels, tablist.nextSibling);
    }
    if (selectedKey) this.activateSearchTab(selectedKey);
  }

  activateSearchTab(key) {
    var root = this.resultsContainer && this.resultsContainer.querySelector('#predictive-search-results');
    if (!root) return;
    root.querySelectorAll('.predictive-search__tab').forEach(function(tab) {
      var selected = tab.dataset.searchTab === key;
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.tabIndex = selected ? 0 : -1;
    });
    root.querySelectorAll('.predictive-search__tab-panel').forEach(function(panel) {
      panel.hidden = panel.dataset.searchPanel !== key;
    });
  }

  handleTabKeydown(event) {
    var tabs = Array.from(event.currentTarget.parentNode.querySelectorAll('[role="tab"]'));
    var index = tabs.indexOf(event.currentTarget);
    var next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
    if (next < 0) return;
    event.preventDefault();
    tabs[next].focus();
    this.activateSearchTab(tabs[next].dataset.searchTab);
  }

  /**
   * Keyboard navigation for predictive search results
   */
  handleKeydown(event) {
    if (!this.resultsContainer) return;
    var items = this.resultsContainer.querySelectorAll('[role="option"] a, .predictive-search__link');
    if (!items.length) return;

    var currentIndex = Array.from(items).indexOf(document.activeElement);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      var nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      items[nextIndex].focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      var prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      items[prevIndex].focus();
    }
  }

  showLoading() {
    if (this.loadingEl) this.loadingEl.classList.remove('hidden');
  }

  hideLoading() {
    if (this.loadingEl) this.loadingEl.classList.add('hidden');
  }
}
if (!customElements.get('search-modal')) customElements.define('search-modal', SearchModal);
