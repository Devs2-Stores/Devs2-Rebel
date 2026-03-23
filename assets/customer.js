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
      this.allProvince = [];
      this.allDistrict = [];
      this.allWard = [];
      this.loadedData = false;
    }

    connectedCallback() {
      this.bindEvents();
    }

    bindEvents() {
      // Close button events
      this.querySelectorAll('[data-action="close-address-modal"]').forEach(el => {
        el.addEventListener('click', () => this.close());
      });

      // Country change event
      const countrySelect = this.querySelector('[name="address[country]"], [name="Country"]');
      if (countrySelect) {
        countrySelect.addEventListener('change', () => this.handleCountryChange(countrySelect));
      }

      // Province/District/Ward change events
      this.addEventListener('change', (e) => {
        const select = e.target.closest('select[data-address-type]');
        if (!select) return;

        const type = select.dataset.addressType;
        const zone = select.dataset.addressZone;

        if (type === 'province') {
          this.setDistrict(zone, select.value, undefined);
          this.setWard(zone, '', undefined);
        } else if (type === 'district') {
          this.setWard(zone, select.value, undefined);
        }
      });
    }

    open() {
      this.classList.add('show');
      if (window.ThemeUtils && ThemeUtils.lockScroll) {
        ThemeUtils.lockScroll();
      } else {
        document.body.style.overflow = 'hidden';
      }
      if (window.ThemeUtils && ThemeUtils.trapFocus) ThemeUtils.trapFocus(this);

      // Force-select country từ data-default (luôn chạy, dù value đã có)
      // để selectedIndex đúng → data-provinces đọc được → province populate chính xác
      const countrySelect = this.querySelector('[name="address[country]"], [name="Country"]');
      if (countrySelect && countrySelect.dataset.default) {
        const defVal = countrySelect.dataset.default;
        const matchOpt = Array.from(countrySelect.options).find(
          opt => opt.value === defVal || opt.text === defVal
        );
        if (matchOpt) matchOpt.selected = true;
      }

      // Populate province từ data-provinces + show/hide fields
      if (countrySelect) this.handleCountryChange(countrySelect);

      // Load district/ward data for Vietnamese address cascade
      this.loadData().then(() => {
        this.refreshAddressZones();
      });
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

    handleCountryChange(select) {
      // Haravan dùng data-default để set selected, nên cần fallback
      const val = select.value || select.dataset.default || '';
      const isVN = val === 'Việt Nam' || val === 'Vietnam' || val === 'Viet Nam' || val === '';
      this.querySelectorAll('.not-vn').forEach(field => {
        field.style.display = isVN ? '' : 'none';
      });
      // Populate province từ data-provinces của country option
      this.querySelectorAll('select[data-address-type="province"]').forEach(ps => {
        this.setProvinceFromCountry(select, ps.dataset.addressZone, ps.dataset.default || '');
      });
    }

    // Đọc data-provinces từ country option (Haravan đã nhúng sẵn trong HTML)
    setProvinceFromCountry(countrySelect, zone, defaultVal) {
      const $province = this.querySelector(`select[data-address-type='province'][data-address-zone='${zone}']`);
      if (!$province) return;

      const selectedOpt = countrySelect.options[countrySelect.selectedIndex];
      let provinces = [];
      try {
        provinces = JSON.parse(selectedOpt?.getAttribute('data-provinces') || '[]');
      } catch (e) {}

      if (!provinces.length) {
        $province.innerHTML = '<option value="" hidden>---</option>';
        $province.disabled = true;
        return;
      }

      let html = '<option value="" hidden>---</option>';
      provinces.forEach(p => {
        const name = Array.isArray(p) ? p[0] : (p.name || p);
        const selected = name === defaultVal ? ' selected' : '';
        html += `<option value="${name}"${selected}>${name}</option>`;
      });
      $province.disabled = false;
      $province.innerHTML = html;
    }

    async loadData() {
      if (this.loadedData) return;
      try {
        const resp = await fetch('/checkout/addresses.json');
        if (!resp.ok) throw new Error('Address API not available');
        const rs = await resp.json();
        this.allProvince = rs.provinces;
        this.allDistrict = rs.districts;
        this.allWard = rs.wards;
        this.loadedData = true;
      } catch (e) {
        console.error('Failed to load address data:', e);
      }
    }

    setProvince(zone, province) {
      const $province = this.querySelector(`select[data-address-type='province'][data-address-zone='${zone}']`);
      if (!$province) return;

      let list = '<option value="" hidden>---</option>';
      this.allProvince.forEach(p => {
        const selected = p.name === province ? ' selected' : '';
        list += `<option value="${p.name}"${selected}>${p.name}</option>`;
      });
      $province.innerHTML = list;
    }

    setDistrict(zone, province, district) {
      const $district = this.querySelector(`select[data-address-type='district'][data-address-zone='${zone}']`);
      if (!$district) return;

      if (!province) {
        $district.value = '';
        $district.disabled = true;
        $district.innerHTML = '';
        return;
      }

      const provinceObj = this.allProvince.find(p => p.name === province);
      if (!provinceObj) return;

      const districts = this.allDistrict.filter(d => d.province_id === provinceObj.id);
      let list = '<option value="" hidden>---</option>';
      districts.forEach(d => {
        const selected = d.name === district ? ' selected' : '';
        list += `<option value="${d.name}"${selected}>${d.name}</option>`;
      });
      $district.disabled = false;
      $district.innerHTML = list;
    }

    setWard(zone, district, ward) {
      const $ward = this.querySelector(`select[data-address-type='ward'][data-address-zone='${zone}']`);
      if (!$ward) return;

      if (!district) {
        $ward.value = '';
        $ward.disabled = true;
        $ward.innerHTML = '';
        return;
      }

      const districtObj = this.allDistrict.find(d => d.name === district);
      if (!districtObj) return;

      const wards = this.allWard.filter(w => w.district_id === districtObj.id);
      let list = '<option value="" hidden>---</option>';
      wards.forEach(w => {
        const selected = w.name === ward ? ' selected' : '';
        list += `<option value="${w.name}"${selected}>${w.name}</option>`;
      });
      $ward.disabled = false;
      $ward.innerHTML = list;
    }

    async refreshAddressZones() {
      // Province: đọc từ data-provinces trong HTML (không cần API)
      const countrySelect = this.querySelector('[name="address[country]"], [name="Country"]');
      if (countrySelect) {
        this.querySelectorAll('select[data-address-type="province"]').forEach(ps => {
          this.setProvinceFromCountry(countrySelect, ps.dataset.addressZone, ps.dataset.default || '');
        });
      }

      // District/Ward: từ API (VN)
      await this.loadData();

      const zones = {};
      this.querySelectorAll('select[data-address-type="province"]').forEach(ps => {
        const z = ps.dataset.addressZone;
        if (!zones[z]) zones[z] = {};
        zones[z].province = ps.value || ps.dataset.default || '';
      });
      this.querySelectorAll('select[data-address-type="district"]').forEach(ds => {
        const z = ds.dataset.addressZone;
        if (!zones[z]) zones[z] = {};
        zones[z].district = ds.value || ds.dataset.default || '';
      });
      this.querySelectorAll('select[data-address-type="ward"]').forEach(ws => {
        const z = ws.dataset.addressZone;
        if (!zones[z]) zones[z] = {};
        zones[z].ward = ws.value || ws.dataset.default || '';
      });

      Object.keys(zones).forEach(zoneName => {
        const zone = zones[zoneName];
        this.setDistrict(zoneName, zone.province, zone.district);
        this.setWard(zoneName, zone.district, zone.ward);
      });
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
        alert(this.dataset.passwordMismatch || 'Passwords do not match.');
        this.confirmPassword.focus();
        return false;
      }
      if (this.newPassword.value.length < 8) {
        e.preventDefault();
        alert(this.dataset.passwordMinLength || 'Password must be at least 8 characters.');
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
