(function() {
  'use strict';

  /* -------------------------------------------------------------------------- */
  /*                               AUTH FORM                                    */
  /* -------------------------------------------------------------------------- */

  class AuthForm extends HTMLElement {
    connectedCallback() {
      this.bindEvents();
      this.handleInitialHash();
    }

    handleInitialHash() {
      if (window.location.hash === '#recover') {
        this.classList.remove('login-layout');
        this.classList.add('recover-layout');
      } else {
        this.classList.remove('recover-layout');
        this.classList.add('login-layout');
      }
    }

    bindEvents() {
      this.addEventListener('click', (e) => {
        const trigger = e.target.closest('.auth-layout-trigger');
        if (!trigger) return;
        e.preventDefault();
        const layout = trigger.dataset.layout;
        this.classList.remove('login-layout', 'recover-layout');
        this.classList.add(layout);
      });
    }
  }
  if (!customElements.get('auth-form')) customElements.define('auth-form', AuthForm);

  /* -------------------------------------------------------------------------- */
  /*                            CUSTOMER SIDEBAR                                */
  /* -------------------------------------------------------------------------- */

  class CustomerSidebar extends HTMLElement {
    connectedCallback() {
      this.highlightActiveLink();
    }

    highlightActiveLink() {
      const path = window.location.pathname;
      const search = window.location.search;
      const links = this.querySelectorAll('a');

      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href === path + search) {
          link.classList.add('active');
        }
        // Highlight orders menu for order detail pages
        if (path.includes('/account/orders/') && href === '/account?view=orders') {
          link.classList.add('active');
        }
      });
    }
  }
  if (!customElements.get('customer-sidebar')) customElements.define('customer-sidebar', CustomerSidebar);

  /* -------------------------------------------------------------------------- */
  /*                             ADDRESS MODAL                                  */
  /* -------------------------------------------------------------------------- */

  class AddressModal extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.bindEvents();
      this.initAddressSelects();
    }

    bindEvents() {
      this.querySelectorAll('[data-action="close-address-modal"]').forEach(el => {
        el.addEventListener('click', () => this.close());
      });
    }

    initAddressSelects() {
      const forms = this.querySelectorAll('form');
      const containers = forms.length ? Array.from(forms) : [this];

      containers.forEach(container => {
        const countrySelect = container.querySelector('select[name="address[country]"], select[name="Country"]');
        const provinceSelect = container.querySelector('select[name="address[province]"], select[name="Province"]');
        if (!countrySelect) return;

        if (countrySelect.dataset.default) {
          const defaultCountry = countrySelect.dataset.default;
          const matchOption = Array.from(countrySelect.options).find(
            opt => opt.value === defaultCountry || opt.text === defaultCountry
          );
          if (matchOption) {
            countrySelect.value = matchOption.value;
            matchOption.selected = true;
          }
        }

        if (provinceSelect) {
          this.populateProvinces(countrySelect, provinceSelect, true);
          if (!countrySelect._hasAddressListener) {
            countrySelect._hasAddressListener = true;
            countrySelect.addEventListener('change', () => {
              this.populateProvinces(countrySelect, provinceSelect, false);
            });
          }
        }
      });
    }

    populateProvinces(countrySelect, provinceSelect, isInitial) {
      const selectedOption = countrySelect.options[countrySelect.selectedIndex];
      let provinces = [];

      if (selectedOption && selectedOption.hasAttribute('data-provinces')) {
        try {
          provinces = JSON.parse(selectedOption.getAttribute('data-provinces') || '[]');
        } catch (e) {
          provinces = [];
        }
      }

      while (provinceSelect.options.length > 1) {
        provinceSelect.remove(1);
      }

      const defaultProvince = isInitial ? (provinceSelect.dataset.default || '') : '';
      let hasSelected = false;

      if (Array.isArray(provinces) && provinces.length > 0) {
        let matchedOption = null;
        provinces.forEach(p => {
          const value = Array.isArray(p) ? p[0] : (typeof p === 'object' && p !== null ? (p.value || p.name) : String(p));
          const label = Array.isArray(p) ? (p[1] || p[0]) : (typeof p === 'object' && p !== null ? (p.label || p.name || p.value) : String(p));
          const option = new Option(label, value);
          if (defaultProvince && (value === defaultProvince || label === defaultProvince)) {
            matchedOption = option;
          }
          provinceSelect.add(option);
        });

        if (matchedOption) {
          matchedOption.selected = true;
          hasSelected = true;
        }
      }

      if (!hasSelected && provinceSelect.options.length > 0) {
        provinceSelect.selectedIndex = 0;
      }

      const provinceGroup = provinceSelect.closest('.form-group');
      if (!provinces || provinces.length === 0) {
        if (provinceGroup) provinceGroup.hidden = true;
        provinceSelect.disabled = true;
      } else {
        if (provinceGroup) provinceGroup.hidden = false;
        provinceSelect.disabled = false;
      }
    }

    open() {
      this.classList.add('show');
      if (window.ThemeUtils && ThemeUtils.lockScroll) {
        ThemeUtils.lockScroll();
      } else {
        document.body.style.overflow = 'hidden';
      }
      if (window.ThemeUtils && ThemeUtils.trapFocus) ThemeUtils.trapFocus(this);
    }

    close() {
      this.classList.remove('show');
      if (window.ThemeUtils && ThemeUtils.unlockScroll) {
        ThemeUtils.unlockScroll();
      } else {
        document.body.style.overflow = '';
      }
      if (window.ThemeUtils && ThemeUtils.releaseFocus) ThemeUtils.releaseFocus(this);
    }
  }
  if (!customElements.get('address-modal')) customElements.define('address-modal', AddressModal);

  /* -------------------------------------------------------------------------- */
  /*                            TOGGLE PASSWORD                                 */
  /* -------------------------------------------------------------------------- */

  class TogglePassword extends HTMLElement {
    connectedCallback() {
      this.input = this.querySelector('input[type="password"], input[type="text"]');
      this.iconShow = this.querySelector('.icon-eye-show');
      this.iconHide = this.querySelector('.icon-eye-hide');

      if (this.input && (this.iconShow || this.iconHide)) {
        // Click on either icon to toggle
        [this.iconShow, this.iconHide].forEach(icon => {
          if (icon) {
            icon.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              this.toggle();
            });
          }
        });
      }
    }

    toggle() {
      const isPassword = this.input.type === 'password';
      this.input.type = isPassword ? 'text' : 'password';
      this.classList.toggle('is-visible', isPassword);
    }
  }
  if (!customElements.get('toggle-password')) customElements.define('toggle-password', TogglePassword);

  /* -------------------------------------------------------------------------- */
  /*                         CHANGE PASSWORD FORM                               */
  /* -------------------------------------------------------------------------- */

  class ChangePasswordForm extends HTMLElement {
    connectedCallback() {
      this.form = this.querySelector('form');
      this.newPassword = this.querySelector('[name="Password"], [name="customer[password]"]');
      this.confirmPassword = this.querySelector('[name="ConfirmPassword"], [name="customer[password_confirmation]"]');
      if (this.form) {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
      }
    }

    handleSubmit(e) {
      if (!this.newPassword || !this.confirmPassword) return;
      if (this.newPassword.value !== this.confirmPassword.value) {
        e.preventDefault();
        var msg = this.dataset.passwordMismatch || 'Passwords do not match.';
        if (typeof showToast === 'function') showToast(msg, 'error', 3000);
        this.confirmPassword.focus();
        return false;
      }
      if (this.newPassword.value.length < 8) {
        e.preventDefault();
        var msg = this.dataset.passwordMinLength || 'Password must be at least 8 characters.';
        if (typeof showToast === 'function') showToast(msg, 'error', 3000);
        this.newPassword.focus();
        return false;
      }
    }
  }
  if (!customElements.get('change-password-form')) customElements.define('change-password-form', ChangePasswordForm);

  /* -------------------------------------------------------------------------- */
  /*                          ADDRESS MODAL TRIGGERS                            */
  /* -------------------------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function() {
    // Open modal
    document.addEventListener('click', function(e) {
      const openBtn = e.target.closest('[data-action="open-address-modal"]');
      if (openBtn) {
        const modalId = openBtn.dataset.modalId;
        const modal = document.getElementById(modalId);
        if (modal && modal.open) modal.open();
      }

      // Delete address
      const deleteBtn = e.target.closest('[data-action="delete-address"]');
      if (deleteBtn) {
        const addressId = deleteBtn.dataset.addressId;
        const confirmMsg = deleteBtn.dataset.confirm || 'Are you sure you wish to delete this address?';
        if (confirm(confirmMsg)) {
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = '/account/addresses/' + addressId;
          const methodInput = document.createElement('input');
          methodInput.type = 'hidden';
          methodInput.name = '_method';
          methodInput.value = 'delete';
          form.appendChild(methodInput);
          document.body.appendChild(form);
          form.submit();
        }
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('address-modal.show').forEach(modal => modal.close());
      }
    });
  });

})();
