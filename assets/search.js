(function() {
'use strict';

// Search Template Component
class SearchTemplate extends HTMLElement {
  constructor() {
    super();
    this.searchForm = null;
    this.searchInput = null;
    this.results = null;
  }

  connectedCallback() {
    this.cacheElements();
    this.bindEvents();
    this.focusSearchInput();
  }

  cacheElements() {
    this.searchForm = this.querySelector('.search-template__form');
    this.searchInput = this.querySelector('.search-template__input');
    this.results = this.querySelector('[data-search-results]');
    this.tabs = [...this.querySelectorAll('[data-search-tab]')];
  }

  bindEvents() {
    if (this.searchInput) {
      this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    if (this.searchForm) {
      this.searchForm.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    this.tabs.forEach((tab) => tab.addEventListener('click', () => this.activateTab(tab.dataset.searchTab)));
    this.activateInitialTab();
    this.addEventListener('click', (e) => this.handlePagination(e));
  }

  activateInitialTab() {
    const firstAvailable = this.tabs.find((tab) => Number(tab.querySelector('span')?.textContent || 0) > 0);
    if (firstAvailable) this.activateTab(firstAvailable.dataset.searchTab);
  }

  activateTab(type) {
    this.tabs.forEach((tab) => {
      const active = tab.dataset.searchTab === type;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      tab.id = `search-${tab.dataset.searchTab}-tab`;
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

  async handlePagination(e) {
    const link = e.target.closest('.search-template__pagination a');
    if (!link || !this.results) return;
    e.preventDefault();
    const url = new URL(link.href, window.location.origin);
    url.searchParams.set('section_id', this.results.dataset.sectionId);
    this.results.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Search pagination failed');
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const nextResults = doc.querySelector('[data-search-results]');
      if (!nextResults) throw new Error('Search results section missing');
      this.results.replaceWith(nextResults);
      this.results = nextResults;
      this.tabs = [...this.querySelectorAll('[data-search-tab]')];
      this.activateInitialTab();
      window.history.pushState({}, '', link.href);
      window.scrollTo({ top: this.results.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
    } catch (error) {
      window.location.href = link.href;
    } finally {
      this.results.removeAttribute('aria-busy');
    }
  }
}

if (!customElements.get('search-template')) customElements.define('search-template', SearchTemplate);

})();
