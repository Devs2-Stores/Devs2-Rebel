/* -------------------------------------------------------------------------- */
/*                        LOCALIZATION SELECTOR                               */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

  class LocalizationSelector extends HTMLElement {
    connectedCallback() {
      this.details = this.querySelector('details');
      this.summary = this.querySelector('summary');
      this.searchWrap = this.querySelector('.localization-selector__search');
      this.searchInput = this.querySelector('.localization-selector__search-input');
      this.empty = this.querySelector('.localization-selector__empty');
      this.items = Array.prototype.slice.call(this.querySelectorAll('.localization-selector__item'));
      if (!this.details || !this.summary) return;

      this.onKeydown = this.onKeydown.bind(this);
      this.onOutside = this.onOutside.bind(this);
      this.onFocusOut = this.onFocusOut.bind(this);

      this.details.addEventListener('toggle', this.onToggle.bind(this));
      this.addEventListener('keydown', this.onKeydown);
      this.addEventListener('focusout', this.onFocusOut);
      if (this.searchInput) {
        this.searchWrap.hidden = false;
        this.searchInput.addEventListener('input', this.filter.bind(this));
      }
    }

    disconnectedCallback() {
      document.removeEventListener('pointerdown', this.onOutside);
    }

    onToggle() {
      if (this.details.open) {
        document.addEventListener('pointerdown', this.onOutside);
        if (this.searchInput) this.searchInput.focus({ preventScroll: true });
      } else {
        document.removeEventListener('pointerdown', this.onOutside);
        if (this.searchInput && this.searchInput.value) {
          this.searchInput.value = '';
          this.filter();
        }
      }
    }

    onOutside(event) {
      if (!this.contains(event.target)) this.details.open = false;
    }

    onFocusOut(event) {
      if (!this.details.open) return;
      var next = event.relatedTarget;
      if (next && !this.contains(next)) this.details.open = false;
    }

    visibleOptions() {
      return this.items
        .filter(function(item) { return !item.hidden; })
        .map(function(item) { return item.querySelector('.localization-selector__option'); });
    }

    filter() {
      var query = this.searchInput.value.trim().toLowerCase();
      var shown = 0;
      this.items.forEach(function(item) {
        var match = !query || (item.dataset.filter || '').indexOf(query) !== -1;
        item.hidden = !match;
        if (match) shown += 1;
      });
      if (this.empty) this.empty.hidden = shown !== 0;
    }

    onKeydown(event) {
      if (!this.details.open) return;
      if (event.key === 'Escape') {
        event.stopPropagation();
        this.details.open = false;
        this.summary.focus({ preventScroll: true });
        return;
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      var options = this.visibleOptions();
      if (!options.length) return;
      var current = options.indexOf(document.activeElement);
      var step = event.key === 'ArrowDown' ? 1 : -1;
      var target;
      if (current === -1) {
        if (event.key === 'ArrowUp') return;
        target = options[0];
      } else if (current + step < 0) {
        target = this.searchInput || options[0];
      } else {
        target = options[Math.min(current + step, options.length - 1)];
      }
      event.preventDefault();
      target.focus({ preventScroll: false });
    }
  }

  if (!customElements.get('localization-selector')) customElements.define('localization-selector', LocalizationSelector);
})();
