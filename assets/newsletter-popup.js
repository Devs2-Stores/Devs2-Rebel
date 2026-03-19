class NewsletterPopup {
  constructor() {
    this.storageKey = 'newsletter_popup_closed';
    this.timeToShow = 3000;
    this.elements = {
      popup: null,
      closeButton: null,
      form: null,
      emailInput: null
    }

    this.init();
  }

  cacheElements() {
    this.elements.popup = document.getElementById('newsletter-popup');
    this.elements.closeButton = this.elements.popup.querySelector('button[data-action="close-newsletter-popup"]');
    this.elements.form = this.elements.popup.querySelector('#newsletter-popup-form');
    this.elements.emailInput = this.elements.form.querySelector('input[name="EMAIL"]');
  }

  init() {
    this.cacheElements();
    this.bindEvents();
    this.checkPopupStatus();
  }

  bindEvents() {
    this.elements.closeButton.addEventListener('click', this.closePopup.bind(this));
    this.elements.form.addEventListener('submit', this.handleFormSubmit.bind(this));
  }

  checkPopupStatus() {
    const isClosed = localStorage.getItem(this.storageKey);
    if (!isClosed) {
      setTimeout(() => this.showPopup(), this.timeToShow);
    }
  }

  showPopup() {
    this.elements.popup.classList.add('active');
  }

  closePopup() {
    this.elements.popup.classList.remove('active');
    localStorage.setItem(this.storageKey, 'true');
  }

  resetPopup() {
    localStorage.removeItem(this.storageKey);
  }

  handleFormSubmit(event) {
    event.preventDefault();
    const email = this.elements.emailInput.value.trim();
    if (this.validateEmail(email)) {
      this.submitForm(email);
    } else {
      alert('Vui lòng nhập địa chỉ email hợp lệ.');
    }
  }

  validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  submitForm(email) {
    const form = this.elements.form;
    if (form) {
      form.submit();
    }
  }
}
window.newsletterPopup = new NewsletterPopup();