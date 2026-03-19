/**
 * FAQ Page
 * - Vietnamese diacritics-insensitive search
 * - Show/hide questions + groups based on query
 */
(function() {
  'use strict';

  function removeDiacritics(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd');
  }

  function normalize(str) {
    return removeDiacritics((str || '').toLowerCase().trim());
  }

  class FaqPage extends HTMLElement {
    connectedCallback() {
      this.searchInput = this.querySelector('#faq-search');
      this.groups = Array.from(this.querySelectorAll('.faq-group'));
      this.items = Array.from(this.querySelectorAll('.faq-item'));
      this.emptyEl = this.querySelector('#faq-empty');

      if (!this.items.length) return;

      this.buildData();
      this.bindEvents();
    }

    buildData() {
      this.faqData = this.items.map(function(item) {
        return {
          el: item,
          group: item.closest('.faq-group'),
          text: normalize(item.dataset.faqQuestion)
        };
      });
    }

    bindEvents() {
      var self = this;
      var timer;
      this.searchInput.addEventListener('input', function() {
        clearTimeout(timer);
        timer = setTimeout(function() {
          self.filter();
        }, 200);
      });
    }

    filter() {
      var query = normalize(this.searchInput.value);
      var visibleCount = 0;

      this.faqData.forEach(function(faq) {
        if (!query || faq.text.indexOf(query) !== -1) {
          faq.el.classList.remove('is-hidden');
          visibleCount++;
        } else {
          faq.el.classList.add('is-hidden');
          faq.el.removeAttribute('open');
        }
      });

      // Hide groups with no visible items
      this.groups.forEach(function(group) {
        var hasVisible = group.querySelector('.faq-item:not(.is-hidden)');
        group.classList.toggle('is-hidden', !hasVisible);
      });

      this.emptyEl.style.display = visibleCount === 0 ? '' : 'none';
    }
  }

  if (!customElements.get('faq-page')) {
    customElements.define('faq-page', FaqPage);
  }
})();
