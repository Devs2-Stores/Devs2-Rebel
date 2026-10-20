(function() {
'use strict';

class ContactPage extends HTMLElement {
  constructor() {
    super();
    this.form = null;
    this.submitButton = null;
    this.isSubmitting = false;
    this.awaitingNavigation = false;
    this.onBeforeUnload = () => {
      this.awaitingNavigation = false;
      this.lockSubmit();
    };
  }

  connectedCallback() {
    this.lifecycle = new AbortController();
    this.cacheElements();
    this.bindEvents();
    this.initFormValidation();
  }

  disconnectedCallback() {
    if (this.lifecycle) this.lifecycle.abort();
    window.removeEventListener('beforeunload', this.onBeforeUnload);
  }

  cacheElements() {
    this.form = this.querySelector('form');
    this.submitButton = this.querySelector('.contact-form__submit');
  }

  bindEvents() {
    const signal = this.lifecycle.signal;
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e), { signal });
    }

    const inputs = this.querySelectorAll('.form-control');
    inputs.forEach((input) => {
      input.addEventListener('blur', () => this.validateField(input), { signal });
      input.addEventListener('input', () => this.clearFieldError(input), { signal });
    });

    window.addEventListener('pageshow', (e) => {
      if (!e.persisted) return;
      this.awaitingNavigation = false;
      window.removeEventListener('beforeunload', this.onBeforeUnload);
      this.isSubmitting = false;
      this.setSubmitButtonState(false);
    }, { signal });
  }

  initFormValidation() {
    const phoneInput = this.querySelector('input[type="tel"]');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9\s\-\+\(\)]/g, '');
      }, { signal: this.lifecycle.signal });
    }
  }

  validateField(field) {
    const formGroup = field.closest('.form-group');
    if (!formGroup) return true;

    let isValid = true;
    let errorMessage = '';

    if (field.hasAttribute('required') && !field.value.trim()) {
      isValid = false;
      errorMessage = this.dataset.msgRequired;
    } else if (field.type === 'email' && field.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(field.value)) {
        isValid = false;
        errorMessage = this.dataset.msgEmail;
      }
    } else if (field.type === 'tel' && field.value.trim()) {
      const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
      if (!phoneRegex.test(field.value)) {
        isValid = false;
        errorMessage = this.dataset.msgPhone;
      }
    }

    if (!isValid) {
      this.showFieldError(formGroup, field, errorMessage);
    } else {
      this.clearFieldError(field);
    }

    return isValid;
  }

  showFieldError(formGroup, field, message) {
    field.classList.add('is-invalid');
    field.setAttribute('aria-invalid', 'true');

    let errorElement = formGroup.querySelector('.form-error-message');
    if (!errorElement) {
      errorElement = document.createElement('span');
      errorElement.className = 'form-error-message';
      errorElement.id = field.id + '-error';
      formGroup.appendChild(errorElement);
    }
    errorElement.textContent = message;
    if (errorElement.id) field.setAttribute('aria-describedby', errorElement.id);
  }

  clearFieldError(field) {
    const formGroup = field.closest('.form-group');
    if (!formGroup) return;

    field.classList.remove('is-invalid');
    field.removeAttribute('aria-invalid');
    const errorElement = formGroup.querySelector('.form-error-message');
    if (errorElement && !errorElement.hasAttribute('data-server-error')) {
      errorElement.remove();
      field.removeAttribute('aria-describedby');
    }
  }

  handleSubmit(e) {
    if (this.isSubmitting) {
      e.preventDefault();
      return;
    }

    const inputs = this.form.querySelectorAll('.form-control');
    let isFormValid = true;

    inputs.forEach((input) => {
      if (!this.validateField(input)) {
        isFormValid = false;
      }
    });

    if (!isFormValid) {
      e.preventDefault();
      const firstInvalidField = this.form.querySelector('.is-invalid');
      if (firstInvalidField) {
        firstInvalidField.focus();
        firstInvalidField.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
      return;
    }

    setTimeout(() => {
      if (!e.defaultPrevented) {
        this.lockSubmit();
        return;
      }
      if (this.awaitingNavigation) return;
      this.awaitingNavigation = true;
      window.addEventListener('beforeunload', this.onBeforeUnload, { once: true });
    }, 0);
  }

  lockSubmit() {
    this.isSubmitting = true;
    this.setSubmitButtonState(true);
  }

  setSubmitButtonState(loading) {
    if (!this.submitButton) return;

    this.submitButton.disabled = loading;
    this.submitButton.classList.toggle('loading', loading);
    if (loading) {
      this.submitButton.setAttribute('aria-disabled', 'true');
    } else {
      this.submitButton.removeAttribute('aria-disabled');
    }
    const textElement = this.submitButton.querySelector('.contact-form__submit-text');
    const loadingElement = this.submitButton.querySelector('.contact-form__submit-loading');
    if (textElement) textElement.hidden = loading;
    if (loadingElement) loadingElement.hidden = !loading;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('contact-page')) {
  customElements.define('contact-page', ContactPage);
}

})();