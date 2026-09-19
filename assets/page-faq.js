(function() {
  'use strict';

  function normalize(value) {
    return (value || '')
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .trim();
  }

  class FaqPage extends HTMLElement {
    connectedCallback() {
      this.searchInput = this.querySelector('[data-faq-search]');
      this.items = Array.from(this.querySelectorAll('[data-faq-item]'));
      this.headings = Array.from(this.querySelectorAll('.faq-group-heading'));
      this.emptyElement = this.querySelector('[data-faq-empty]');

      if (!this.searchInput || !this.items.length) return;

      var currentHeading = null;
      Array.from(this.querySelector('.faq-list').children).forEach(function(element) {
        if (element.classList.contains('faq-group-heading')) {
          currentHeading = element;
          return;
        }

        if (element.hasAttribute('data-faq-item')) {
          element.faqSearchContent = normalize(element.dataset.faqQuestion + ' ' + element.dataset.faqAnswer);
          element.faqHeading = currentHeading;
        }
      });

      this.searchInput.addEventListener('input', this.filter.bind(this));
      this.items.forEach(function(item) {
        item.addEventListener('toggle', function() {
          if (!item.open) return;
          this.items.forEach(function(otherItem) {
            if (otherItem !== item) otherItem.removeAttribute('open');
          });
        }.bind(this));
      }, this);
    }

    filter() {
      var query = normalize(this.searchInput.value);
      var visibleCount = 0;

      this.items.forEach(function(item) {
        var isVisible = !query || item.faqSearchContent.indexOf(query) !== -1;

        item.hidden = !isVisible;
        if (!isVisible) item.removeAttribute('open');
        if (isVisible) visibleCount += 1;
      }, this);

      this.headings.forEach(function(heading) {
        heading.hidden = !this.items.some(function(item) {
          return item.faqHeading === heading && !item.hidden;
        });
      }, this);

      if (this.emptyElement) this.emptyElement.hidden = visibleCount > 0;
    }
  }

  if (!customElements.get('faq-page')) customElements.define('faq-page', FaqPage);
})();
