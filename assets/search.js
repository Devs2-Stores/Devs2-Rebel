(function() {
'use strict';

// Search Template Component
class SearchTemplate extends HTMLElement {
  constructor() {
    super();
    this.searchForm = null;
    this.searchInput = null;
  }

  connectedCallback() {
    this.lifecycle = new AbortController();
    this.cacheElements();
    this.bindEvents();
    this.focusSearchInput();
  }

  disconnectedCallback() {
    if (this.lifecycle) this.lifecycle.abort();
  }

  cacheElements() {
    this.searchForm = this.querySelector('.search-template__form');
    this.searchInput = this.querySelector('.search-template__input');
    this.tabs = [...this.querySelectorAll('[data-search-tab]')];
  }

  bindEvents() {
    const signal = this.lifecycle.signal;
    if (this.searchInput) {
      this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e), { signal });
    }

    if (this.searchForm) {
      this.searchForm.addEventListener('submit', (e) => this.handleSubmit(e), { signal });
    }
    this.tabs.forEach((tab) => tab.addEventListener('click', () => this.activateTab(tab.dataset.searchTab), { signal }));
    this.activateInitialTab();
    if (window.ThemeUtils) ThemeUtils.bindTablistKeys(this.tabs);
    document.addEventListener('collection:filtered', () => {
      this.tabs = [...this.querySelectorAll('[data-search-tab]')];
      this.tabs.forEach((tab) => tab.addEventListener('click', () => this.activateTab(tab.dataset.searchTab), { signal }));
      if (window.ThemeUtils) ThemeUtils.bindTablistKeys(this.tabs);
      this.activateInitialTab();
    }, { signal });
  }

  activateInitialTab() {
    const firstAvailable = this.tabs.find((tab) => {
      const n = (tab.querySelector('span') || {}).textContent;
      const t = n ? n.trim() : '';
      return !tab.disabled && (t === '' || Number(t) > 0);
    });
    if (firstAvailable) this.activateTab(firstAvailable.dataset.searchTab);
  }

  activateTab(type) {
    this.tabs.forEach((tab) => {
      const active = tab.dataset.searchTab === type;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    this.querySelectorAll('[data-search-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.searchPanel !== type;
    });
    this.querySelectorAll('[data-search-tab-count]').forEach((count) => {
      count.hidden = count.dataset.searchTabCount !== type;
    });
  }

  focusSearchInput() {
    if (this.searchInput && !this.searchInput.value) {
      setTimeout(() => {
        this.searchInput.focus();
      }, 100);
    }
  }

  handleKeydown(e) {
    if (e.key === 'Escape' && this.searchInput) {
      this.searchInput.blur();
    }
  }

  handleSubmit(e) {
    if (!this.searchInput) return;

    const query = this.searchInput.value.trim();

    if (!query) {
      e.preventDefault();
      this.searchInput.focus();
      return;
    }
  }
}

if (!customElements.get('search-template')) customElements.define('search-template', SearchTemplate);

})();
