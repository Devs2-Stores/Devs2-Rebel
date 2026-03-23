/* -------------------------------------------------------------------------- */
/*                                SEARCH MODAL                                */
/* -------------------------------------------------------------------------- */

class SearchModal extends HTMLElement {
  constructor() {
    super();
    this.searchTimeout = null;
    this.debounceDelay = 300;
    this.searchController = null;
  }

  connectedCallback() {
    this.input = this.querySelector('.search-modal-input');
    this.resultsContainer = this.querySelector('.search-modal-results-content');
    this.loadingEl = this.querySelector('.search-modal-loading');
    this.form = this.querySelector('.search-modal-form');
    this.bindEvents();
  }

  bindEvents() {
    var self = this;

    document.addEventListener('click', function(e) {
      var openTrigger = e.target.closest('[data-action="open-search-modal"]');
      var closeTrigger = e.target.closest('[data-action="close-search-modal"]');
      var overlay = e.target.closest('.search-modal-overlay');

      if (openTrigger) {
        e.preventDefault();
        self.open();
      }
      if (closeTrigger || overlay) self.close();
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && self.isOpen()) self.close();
    });

    if (this.input) {
      this.input.addEventListener('input', function(e) {
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

  performSearch(query) {
    var self = this;
    if (!this.resultsContainer) return;
    this.showLoading();

    if (this.searchController) {
      this.searchController.abort();
    }
    this.searchController = new AbortController();

    var fetchUrl;
    if (this.isPredictiveEnabled()) {
      // Use Predictive Search API with Section Rendering
      var params = new URLSearchParams({
        'q': query,
        'section_id': 'predictive-search',
        'resources[type]': 'product,collection,article,query',
        'resources[limit]': '6',
        'resources[options][unavailable_products]': 'last'
      });
      fetchUrl = this.getRootUrl() + 'search/suggest?' + params.toString();
    } else {
      // Fallback: standard search with alternate template
      fetchUrl = this.getRootUrl() + 'search?type=product&q=' + encodeURIComponent(query) + '&view=smart';
    }

    fetch(fetchUrl, { signal: this.searchController.signal })
      .then(function(response) {
        if (!response.ok) throw new Error('Search request failed');
        return response.text();
      })
      .then(function(html) {
        self.displayResults(html);
      })
      .catch(function(error) {
        if (error.name === 'AbortError') return;
        console.error('Search error:', error);
        var errorMsg = (typeof themeConfig !== 'undefined' && themeConfig.strings && themeConfig.strings.cart)
          ? (themeConfig.strings.cart.error || 'An error occurred. Please try again.')
          : 'An error occurred. Please try again.';
        self.displayError(errorMsg);
      })
      .finally(function() {
        if (self.searchController && self.searchController.signal.aborted) {
          return;
        }
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

    // Close modal on result click
    this.resultsContainer.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        self.close();
      });
    });
  }

  displayError(message) {
    if (!this.resultsContainer) return;
    this.resultsContainer.innerHTML = '<div class="search-modal-error"><p>' + message + '</p></div>';
  }

  clearResults() {
    if (!this.resultsContainer) return;
    var placeholder = (typeof themeConfig !== 'undefined' && themeConfig.strings)
      ? ''
      : '';
    this.resultsContainer.innerHTML = '<div class="search-modal-empty"><p>' + (this.dataset.placeholder || 'Enter a keyword to search...') + '</p></div>';
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
customElements.define('search-modal', SearchModal);
