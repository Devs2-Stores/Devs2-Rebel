/* -------------------------------------------------------------------------- */
/*                              NEWSLETTER MODAL                              */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

  class NewsletterModal extends HTMLElement {
    constructor() {
      super();
      this.storageKey = 'newsletter_popup_closed';
      this.timeToShow = 3000;
    }

    connectedCallback() {
      this.overlay = this.closest('.newsletter-popup-wrapper') || this.querySelector('.newsletter-popup-wrapper');
      this.popup = this.querySelector('#newsletter-popup');
      this.closeButton = this.querySelector('[data-action="close-newsletter-popup"]');
      this.form = this.querySelector('form');
      this.emailInput = this.querySelector('input[name="contact[email]"]');

      if (this.popup) {
        this.bindEvents();
        this.checkPopupStatus();
      }
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
    }

    checkPopupStatus() {
      var self = this;
      var isClosed = localStorage.getItem(this.storageKey);
      if (!isClosed) {
        setTimeout(function() {
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
      localStorage.setItem(this.storageKey, 'true');
    }

    handleFormSubmit(event) {
      var email = this.emailInput.value.trim();
      if (this.validateEmail(email)) {
        this.closePopup();
        // Allow form submission normally
      } else {
        event.preventDefault();
        alert('Please enter a valid email address.');
      }
    }

    validateEmail(email) {
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailPattern.test(email);
    }
  }
  customElements.define('newsletter-modal', NewsletterModal);
})();
