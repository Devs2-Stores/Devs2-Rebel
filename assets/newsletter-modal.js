/* -------------------------------------------------------------------------- */
/*                              NEWSLETTER MODAL                              */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

  class NewsletterModal extends HTMLElement {
    constructor() {
      super();
      this.storageKey = 'newsletter_popup_closed';
      this.timeToShow = (parseInt(this.dataset.delay, 10) || 5) * 1000;
    }

    connectedCallback() {
      this.overlay = this.closest('.newsletter-popup-wrapper') || this.querySelector('.newsletter-popup-wrapper');
      this.popup = this.querySelector('#newsletter-popup');
      this.closeButton = this.querySelector('[data-action="close-newsletter-popup"]');
      this.form = this.querySelector('form');
      this.emailInput = this.querySelector('input[name="contact[email]"]');
      this.result = this.querySelector('[data-newsletter-result]');

      if (this.popup) {
        this.bindEvents();
        this.checkPopupStatus();
      }
    }

    disconnectedCallback() {
      clearTimeout(this.showTimer);
    }

    bindEvents() {
      var self = this;
      if (this.closeButton) {
        this.closeButton.addEventListener('click', function() {
          self.closePopup();
        });
      }
      if (this.form) {
        this.form.addEventListener('submit', function(e) {
          self.handleFormSubmit(e);
        });
      }
      this.popup.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && self.popup.classList.contains('active')) self.closePopup();
      });
    }

    checkPopupStatus() {
      var self = this;
      var own = this.form && this.form.id && window.location.hash === '#' + this.form.id;
      if (this.result && !own) {
        this.result.remove();
        this.result = null;
      }
      if (this.result) {
        if (this.result.classList.contains('newsletter-popup-message--success')) {
          ThemeUtils.storage.set(this.storageKey, 'true');
        }
        this.showPopup();
        return;
      }
      var isClosed = ThemeUtils.storage.get(this.storageKey);
      if (!isClosed) {
        this.showTimer = setTimeout(function() {
          self.showPopup();
        }, this.timeToShow);
      }
    }

    showPopup() {
      if (this.popup) {
        this.popup.classList.add('active');
        ThemeUtils.lockScroll();
        ThemeUtils.trapFocus(this.popup);
      }
    }

    closePopup() {
      if (this.popup) {
        this.popup.classList.remove('active');
        ThemeUtils.unlockScroll();
        ThemeUtils.releaseFocus(this.popup);
      }
      ThemeUtils.storage.set(this.storageKey, 'true');
    }

    handleFormSubmit(event) {
      var email = this.emailInput.value.trim();
      if (!this.validateEmail(email)) {
        event.preventDefault();
        if (typeof showToast === 'function' && this.dataset.msgEmail) showToast(this.dataset.msgEmail, 'error', 3000);
      }
    }

    validateEmail(email) {
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailPattern.test(email);
    }
  }
  if (!customElements.get('newsletter-modal')) customElements.define('newsletter-modal', NewsletterModal);
})();
