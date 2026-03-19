// Search Template Component
class SearchTemplate extends HTMLElement {
  constructor() {
    super();
    this.searchForm = null;
    this.searchInput = null;
    this.debounceTimer = null;
  }

  connectedCallback() {
    this.cacheElements();
    this.bindEvents();
    this.focusSearchInput();
  }

  cacheElements() {
    this.searchForm = this.querySelector('.search-template__form');
    this.searchInput = this.querySelector('.search-template__input');
  }

  bindEvents() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => this.handleInput(e));
      this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    if (this.searchForm) {
      this.searchForm.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  focusSearchInput() {
    if (this.searchInput && !this.searchInput.value) {
      setTimeout(() => {
        this.searchInput.focus();
      }, 100);
    }
  }

  handleInput(e) {
    const query = e.target.value.trim();

    clearTimeout(this.debounceTimer);

    // Search is handled by form submit — no need for auto-search
  }

  handleKeydown(e) {
    if (e.key === 'Escape') {
      this.searchInput.blur();
    }
  }

  handleSubmit(e) {
    const query = this.searchInput.value.trim();

    if (!query) {
      e.preventDefault();
      this.searchInput.focus();
      return;
    }
  }
}

customElements.define('search-template', SearchTemplate);
