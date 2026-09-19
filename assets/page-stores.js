/**
 * Store Locator Page
 * - Vietnamese diacritics-insensitive search
 * - Cascading province → district filter
 * - Lazy-load storefront images with a visual loading state
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
      this.bindStoreImages();
      this.strings = {
        allDistricts: this.dataset.allDistricts || '',
        count: this.dataset.countTemplate || '',
        open: this.dataset.openLabel || '',
        closed: this.dataset.closedLabel || ''
      };

      if (!this.cards.length) return;

      this.buildStoreData();
      this.populateProvinces();
      this.updateCount();
      this.bindEvents();
      this.statusTimer = window.setInterval(() => this.updateStoreStatuses(), 60000);
    }

    disconnectedCallback() {
      window.clearInterval(this.statusTimer);
      window.cancelAnimationFrame(this.scrollFrame);
    }

    bindStoreImages() {
      this.querySelectorAll('[data-store-image]').forEach(media => {
        var image = media.querySelector('img');
        if (!image) {
          media.classList.remove('is-loading');
          return;
        }
        var complete = function() {
          media.classList.remove('is-loading');
          media.classList.add('is-loaded');
        };
        var failed = function() {
          media.classList.remove('is-loading');
          media.classList.add('is-error');
        };
        image.addEventListener('load', complete, { once: true });
        image.addEventListener('error', failed, { once: true });
        if (image.complete) {
          if (image.naturalWidth > 0) complete();
          else failed();
        }
      });
    }

    buildStoreData() {
      this.stores = this.cards.map(card => ({
        el: card,
        name: normalize(card.dataset.storeName),
        address: normalize(card.dataset.storeAddress),
        province: (card.dataset.storeProvince || '').trim(),
        district: (card.dataset.storeDistrict || '').trim(),
        provinceNorm: normalize(card.dataset.storeProvince),
        districtNorm: normalize(card.dataset.storeDistrict),
        hours: card.dataset.storeHours || ''
      }));
      this.updateStoreStatuses();
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
      this.districtSelect.replaceChildren(new Option(this.strings.allDistricts, ''));
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
      this.scrollToResults();
    }

    scrollToResults() {
      var grid = this.querySelector('#stores-grid');
      if (!grid) return;

      window.cancelAnimationFrame(this.scrollFrame);
      this.scrollFrame = window.requestAnimationFrame(() => {
        this.scrollFrame = window.requestAnimationFrame(() => {
          grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }

    updateCount(count) {
      if (count === undefined) count = this.cards.length;
      this.countEl.textContent = this.strings.count
        .replace('__count__', count)
        .replace('__total__', this.cards.length);
    }

    updateStoreStatuses() {
      this.stores.forEach(store => {
        var status = store.el.querySelector('[data-store-status]');
        if (!status) return;

        var isOpen = this.getStoreStatus(store.hours, new Date());
        status.textContent = '';
        status.classList.remove('is-open', 'is-closed');
        if (isOpen === null) return;

        status.textContent = isOpen ? this.strings.open : this.strings.closed;
        status.classList.toggle('is-open', isOpen);
        status.classList.toggle('is-closed', !isOpen);
      });
    }

    getStoreStatus(hours, now) {
      var entries = String(hours || '').split(/[\n;,|/]+/).map(entry => entry.trim()).filter(Boolean);
      var fallback = null;
      var today = now.getDay();

      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        var days = this.parseDays(entry);
        if (days && !days.includes(today)) continue;

        var normalizedEntry = normalize(entry);
        var isClosed = /\b(closed|close|dong cua|dong|nghi)\b/.test(normalizedEntry);
        var state = isClosed ? false : this.getRangeStatus(entry, now);
        if (state === null) continue;
        if (days) return state;
        fallback = state;
      }

      return fallback;
    }

    parseDays(value) {
      var text = normalize(value);
      var patterns = [
        { day: 0, expression: /\b(?:sun(?:day)?|cn|chu nhat)\b/g },
        { day: 1, expression: /\b(?:mon(?:day)?|thu\s*(?:2|hai))\b/g },
        { day: 2, expression: /\b(?:tue(?:sday)?|thu\s*(?:3|ba))\b/g },
        { day: 3, expression: /\b(?:wed(?:nesday)?|thu\s*(?:4|tu))\b/g },
        { day: 4, expression: /\b(?:thu(?:rsday)?(?!\s*(?:[2-7]|hai|ba|tu|nam|sau|bay))|thu\s*(?:5|nam))\b/g },
        { day: 5, expression: /\b(?:fri(?:day)?|thu\s*(?:6|sau))\b/g },
        { day: 6, expression: /\b(?:sat(?:urday)?|thu\s*(?:7|bay))\b/g }
      ];
      var matches = [];

      patterns.forEach(function(pattern) {
        var match;
        while ((match = pattern.expression.exec(text)) !== null) {
          matches.push({ day: pattern.day, index: match.index, length: match[0].length });
        }
      });
      if (!matches.length) return null;

      matches.sort(function(a, b) { return a.index - b.index; });
      var days = new Set(matches.map(function(match) { return match.day; }));
      for (var i = 0; i < matches.length - 1; i++) {
        var between = text.slice(matches[i].index + matches[i].length, matches[i + 1].index);
        if (!/[-\u2013\u2014]/.test(between)) continue;
        var day = matches[i].day;
        while (day !== matches[i + 1].day) {
          day = (day + 1) % 7;
          days.add(day);
        }
      }

      return Array.from(days);
    }

    getRangeStatus(value, now) {
      var range = String(value).match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[-\u2013\u2014]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      if (!range) return null;

      var startHour = Number(range[1]);
      var endHour = Number(range[4]);
      var startMeridiem = range[3] || '';
      var endMeridiem = range[6] || '';
      var start = this.toMinutes(startHour, range[2], startMeridiem);
      var end = this.toMinutes(endHour, range[5], endMeridiem);

      if (!endMeridiem && startMeridiem.toLowerCase() === 'am' && endHour <= startHour) {
        end = this.toMinutes(endHour, range[5], 'pm');
      } else if (!startMeridiem && !endMeridiem && startHour <= 12 && endHour <= 12 && end <= start) {
        end += 12 * 60;
      }

      var current = now.getHours() * 60 + now.getMinutes();
      return end < start ? current >= start || current < end : current >= start && current < end;
    }

    toMinutes(hour, minute, meridiem) {
      var value = Number(hour) % 24;
      var minutes = Number(minute || 0);
      if (meridiem) {
        value = value % 12 + (meridiem.toLowerCase() === 'pm' ? 12 : 0);
      }
      return value * 60 + minutes;
    }

  }

  if (!customElements.get('stores-page')) {
    customElements.define('stores-page', StoresPage);
  }
})();
