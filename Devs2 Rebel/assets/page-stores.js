/**
 * Store Locator Page
 * - Vietnamese diacritics-insensitive search
 * - Cascading province → district filter
 * - Lazy-load map iframes on click
 */
(function() {
  'use strict';

  /* ── Helpers ───────────────────────────────────── */
  function removeDiacritics(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd');
  }

  function normalize(str) {
    return removeDiacritics((str || '').toLowerCase().trim());
  }

  /* ── Custom Element ────────────────────────────── */
  class StoresPage extends HTMLElement {
    connectedCallback() {
      this.cards = Array.from(this.querySelectorAll('.stores-card'));
      this.searchInput = this.querySelector('#stores-search');
      this.provinceSelect = this.querySelector('#stores-province');
      this.districtSelect = this.querySelector('#stores-district');
      this.countEl = this.querySelector('#stores-count');
      this.clearBtn = this.querySelector('#stores-clear');
      this.emptyEl = this.querySelector('#stores-empty');

      if (!this.cards.length) return;

      this.buildStoreData();
      this.populateProvinces();
      this.updateCount();
      this.bindEvents();
    }

    buildStoreData() {
      this.stores = this.cards.map(card => ({
        el: card,
        name: normalize(card.dataset.storeName),
        address: normalize(card.dataset.storeAddress),
        province: (card.dataset.storeProvince || '').trim(),
        district: (card.dataset.storeDistrict || '').trim(),
        provinceNorm: normalize(card.dataset.storeProvince),
        districtNorm: normalize(card.dataset.storeDistrict)
      }));
    }

    populateProvinces() {
      var provinces = [];
      var seen = {};
      this.stores.forEach(function(s) {
        if (s.province && !seen[s.province]) {
          seen[s.province] = true;
          provinces.push(s.province);
        }
      });
      provinces.sort();
      provinces.forEach(function(p) {
        var opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        this.provinceSelect.appendChild(opt);
      }.bind(this));
    }

    populateDistricts(province) {
      // Clear current
      this.districtSelect.innerHTML = '<option value="">Tất cả quận huyện</option>';
      if (!province) {
        this.districtSelect.disabled = true;
        return;
      }
      this.districtSelect.disabled = false;
      var districts = [];
      var seen = {};
      this.stores.forEach(function(s) {
        if (s.province === province && s.district && !seen[s.district]) {
          seen[s.district] = true;
          districts.push(s.district);
        }
      });
      districts.sort();
      districts.forEach(function(d) {
        var opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        this.districtSelect.appendChild(opt);
      }.bind(this));
    }

    bindEvents() {
      var self = this;
      var debounceTimer;

      this.searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() {
          self.applyFilters();
        }, 200);
      });

      this.provinceSelect.addEventListener('change', function() {
        self.populateDistricts(this.value);
        self.districtSelect.value = '';
        self.applyFilters();
      });

      this.districtSelect.addEventListener('change', function() {
        self.applyFilters();
      });

      this.clearBtn.addEventListener('click', function() {
        self.searchInput.value = '';
        self.provinceSelect.value = '';
        self.districtSelect.value = '';
        self.districtSelect.disabled = true;
        self.populateDistricts('');
        self.applyFilters();
      });
    }

    applyFilters() {
      var query = normalize(this.searchInput.value);
      var province = this.provinceSelect.value;
      var district = this.districtSelect.value;
      var hasFilter = query || province || district;
      var visibleCount = 0;
      var delay = 0;

      this.stores.forEach(function(store) {
        var show = true;

        // Province filter
        if (province && store.province !== province) show = false;

        // District filter
        if (show && district && store.district !== district) show = false;

        // Search filter
        if (show && query) {
          var matchName = store.name.indexOf(query) !== -1;
          var matchAddr = store.address.indexOf(query) !== -1;
          if (!matchName && !matchAddr) show = false;
        }

        if (show) {
          store.el.classList.remove('is-hidden');
          store.el.style.animationDelay = (delay * 0.05) + 's';
          store.el.style.animation = 'none';
          store.el.offsetHeight; // trigger reflow
          store.el.style.animation = '';
          visibleCount++;
          delay++;
        } else {
          store.el.classList.add('is-hidden');
        }
      });

      this.updateCount(visibleCount);
      this.clearBtn.style.display = hasFilter ? '' : 'none';
      this.emptyEl.style.display = visibleCount === 0 ? '' : 'none';
    }

    updateCount(count) {
      if (count === undefined) count = this.cards.length;
      this.countEl.textContent = 'Hiển thị ' + count + '/' + this.cards.length + ' cửa hàng';
    }

  }

  if (!customElements.get('stores-page')) {
    customElements.define('stores-page', StoresPage);
  }
})();
