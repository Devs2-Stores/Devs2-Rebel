class ContactPage extends HTMLElement {
  constructor() {
    super();
    this.form = null;
    this.submitButton = null;
    this.isSubmitting = false;
  }

  connectedCallback() {
    this.cacheElements();
    this.bindEvents();
    this.initFormValidation();
  }

  cacheElements() {
    this.form = this.querySelector('form');
    this.submitButton = this.querySelector('.contact-form__submit');
  }

  bindEvents() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    const inputs = this.querySelectorAll('.form-control');
    inputs.forEach((input) => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearFieldError(input));
    });
  }

  initFormValidation() {
    const phoneInput = this.querySelector('#contact-phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9\s\-\+\(\)]/g, '');
      });
    }
  }

  validateField(field) {
    const formGroup = field.closest('.form-group');
    if (!formGroup) return true;

    let isValid = true;
    let errorMessage = '';

    if (field.hasAttribute('required') && !field.value.trim()) {
      isValid = false;
      errorMessage = 'Trường này là bắt buộc';
    } else if (field.type === 'email' && field.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(field.value)) {
        isValid = false;
        errorMessage = 'Email không hợp lệ';
      }
    } else if (field.type === 'tel' && field.value.trim()) {
      const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
      if (!phoneRegex.test(field.value)) {
        isValid = false;
        errorMessage = 'Số điện thoại không hợp lệ';
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

    let errorElement = formGroup.querySelector('.form-error-message');
    if (!errorElement) {
      errorElement = document.createElement('span');
      errorElement.className = 'form-error-message';
      formGroup.appendChild(errorElement);
    }
    errorElement.textContent = message;
  }

  clearFieldError(field) {
    const formGroup = field.closest('.form-group');
    if (!formGroup) return;

    field.classList.remove('is-invalid');
    const errorElement = formGroup.querySelector('.form-error-message');
    if (errorElement && !errorElement.hasAttribute('data-server-error')) {
      errorElement.remove();
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

    this.isSubmitting = true;
    this.setSubmitButtonState(true);
  }

  setSubmitButtonState(loading) {
    if (!this.submitButton) return;

    if (loading) {
      this.submitButton.disabled = true;
      this.submitButton.classList.add('loading');
      const textElement = this.submitButton.querySelector('.contact-form__submit-text');
      if (textElement) {
        textElement.textContent = 'Đang gửi...';
      }
    } else {
      this.submitButton.disabled = false;
      this.submitButton.classList.remove('loading');
      const textElement = this.submitButton.querySelector('.contact-form__submit-text');
      if (textElement) {
        textElement.textContent = 'Gửi tin nhắn';
      }
    }
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('contact-page')) {
  customElements.define('contact-page', ContactPage);
}