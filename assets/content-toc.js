(function() {
  'use strict';

  class ContentToc extends HTMLElement {
    connectedCallback() {
      this.disconnectObservers();
      this.contentSelector = this.getAttribute('content-selector') || '[itemprop="articleBody"]';
      this.headingLevels = this.getAttribute('data-heading-levels') || 'h2h3';
      this.showNumbers = this.hasAttribute('data-show-numbers');
      this.collapsible = this.hasAttribute('data-collapsible');
      this.headings = [];
      this.buildToc();
      this.bindEvents();
      if (this.collapsible) this.setupCollapse();
    }

    getHeadingSelector() {
      return this.headingLevels === 'h2' ? 'h2' : 'h2, h3';
    }

    slugify(value) {
      return value.trim().toLowerCase().replace(/đ/g, 'd').normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    buildToc() {
      var self = this;
      var content = document.querySelector(this.contentSelector);
      if (!content) {
        this.style.display = 'none';
        this.setAttribute('aria-busy', 'false');
        return;
      }

      var existingList = this.querySelector('.toc__list');
      if (existingList) existingList.remove();
      this.headings = Array.from(content.querySelectorAll(this.getHeadingSelector()));

      if (this.headings.length === 0) {
        this.style.display = 'none';
        this.setAttribute('aria-busy', 'false');
        return;
      }

      var usedIds = new Set();
      document.querySelectorAll('[id]').forEach(function(element) {
        if (!self.headings.includes(element)) usedIds.add(element.id);
      });

      var tocList = document.createElement('ul');
      tocList.className = 'toc__list';
      tocList.id = 'article-table-of-contents';
      var h2Count = 0;
      var h3Count = 0;

      this.headings.forEach(function(heading) {
        var baseId = heading.id || self.slugify(heading.textContent) || 'section';
        var id = baseId;
        var suffix = 2;
        while (usedIds.has(id)) id = baseId + '-' + suffix++;
        usedIds.add(id);
        heading.id = id;

        var item = document.createElement('li');
        item.className = 'toc__item toc__item--' + heading.tagName.toLowerCase();
        var link = document.createElement('a');
        link.href = '#' + id;
        link.className = 'toc__link';
        var text = heading.textContent.trim();

        if (self.showNumbers) {
          if (heading.tagName === 'H2') {
            h2Count++;
            h3Count = 0;
            text = h2Count + '. ' + text;
          } else {
            h3Count++;
            text = h2Count + '.' + h3Count + '. ' + text;
          }
        }

        link.textContent = text;
        item.appendChild(link);
        tocList.appendChild(item);
      });

      var title = this.querySelector('.toc__title');
      title ? title.insertAdjacentElement('afterend', tocList) : this.appendChild(tocList);
      this.classList.add('toc--ready');
      this.setAttribute('aria-busy', 'false');
      var hashTarget = location.hash && document.getElementById(location.hash.substring(1));
      if (hashTarget && this.headings.includes(hashTarget)) {
        requestAnimationFrame(function() { hashTarget.scrollIntoView({ block: 'start' }); });
      }
    }

    bindEvents() {
      var self = this;
      this.querySelectorAll('.toc__link').forEach(function(link) {
        link.addEventListener('click', function(event) {
          event.preventDefault();
          self.scrollToHeading(this.hash.substring(1));
        });
      });
      this.observeHeadings();
    }

    scrollToHeading(targetId) {
      var target = document.getElementById(targetId);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, '', '#' + targetId);
      this.setActiveHeading(targetId);
    }

    setActiveHeading(id) {
      this.querySelectorAll('.toc__item').forEach(function(item) {
        var link = item.querySelector('.toc__link');
        var active = link && link.hash === '#' + id;
        item.classList.toggle('active', active);
        if (link) active ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current');
      });
    }

    observeHeadings() {
      var self = this;
      if (!this.headings.length) return;

      if (!('IntersectionObserver' in window)) {
        this._scrollFallback = ThemeUtils.debounce(function() {
          var active = self.headings[0];
          self.headings.forEach(function(heading) {
            if (heading.getBoundingClientRect().top <= 140) active = heading;
          });
          self.setActiveHeading(active.id);
        }, 100);
        window.addEventListener('scroll', this._scrollFallback, { passive: true });
        this._scrollFallback();
        return;
      }

      this._headingObserver = new IntersectionObserver(function() {
        var active = self.headings[0];
        self.headings.forEach(function(heading) {
          if (heading.getBoundingClientRect().top <= 140) active = heading;
        });
        self.setActiveHeading(active.id);
      }, { rootMargin: '-140px 0px 0px 0px', threshold: 0 });

      this.headings.forEach(function(heading) { self._headingObserver.observe(heading); });
      this.setActiveHeading(this.headings[0].id);
    }

    setupCollapse() {
      var self = this;
      var toggle = this.querySelector('.toc__toggle');
      var list = this.querySelector('.toc__list');
      if (!toggle || !list) return;
      toggle.setAttribute('aria-controls', list.id);
      toggle.addEventListener('click', function() {
        var collapsed = self.classList.toggle('collapsed');
        list.hidden = collapsed;
        toggle.setAttribute('aria-expanded', String(!collapsed));
      });
    }

    disconnectObservers() {
      if (this._headingObserver) this._headingObserver.disconnect();
      if (this._scrollFallback) window.removeEventListener('scroll', this._scrollFallback);
      this._headingObserver = null;
      this._scrollFallback = null;
    }

    disconnectedCallback() {
      this.disconnectObservers();
    }
  }

  if (!customElements.get('content-toc')) customElements.define('content-toc', ContentToc);

  class TocFloating extends HTMLElement {
    connectedCallback() {
      var self = this;
      this._buildTimer = setTimeout(function() {
        self.inlineToc = document.querySelector('content-toc:not([floating])');
        self.isOpen = false;
        self.buildFloating();
        self.bindEvents();
      }, 100);
    }

    disconnectedCallback() {
      if (this._buildTimer) clearTimeout(this._buildTimer);
      if (this._scrollCheck) window.removeEventListener('scroll', this._scrollCheck);
      if (this._boundEscape) document.removeEventListener('keydown', this._boundEscape);
      if (this.isOpen) ThemeUtils.unlockScroll();
    }

    buildFloating() {
      if (!this.inlineToc) {
        this.style.display = 'none';
        return;
      }
      this.trigger = this.querySelector('.toc-floating__trigger');
      this.panel = this.querySelector('.toc-floating__panel');
      this.overlay = this.querySelector('.toc-floating__overlay');
      if (!this.trigger || !this.panel) return;
      var tocContent = this.inlineToc.querySelector('.toc__list');
      if (tocContent) {
        var existingList = this.panel.querySelector('.toc__list');
        if (existingList) existingList.remove();
        var clonedList = tocContent.cloneNode(true);
        clonedList.removeAttribute('id');
        clonedList.hidden = false;
        this.panel.appendChild(clonedList);
      }
    }

    bindEvents() {
      var self = this;
      if (this.trigger) this.trigger.addEventListener('click', function() { self.toggle(); });
      if (this.overlay) this.overlay.addEventListener('click', function() { self.close(); });
      var closeButton = this.querySelector('.toc-floating__close');
      if (closeButton) closeButton.addEventListener('click', function() { self.close(); });
      this._boundEscape = function(event) { if (event.key === 'Escape' && self.isOpen) self.close(); };
      document.addEventListener('keydown', this._boundEscape);
      this._scrollCheck = ThemeUtils.debounce(function() { self.checkVisibility(); }, 100);
      window.addEventListener('scroll', this._scrollCheck, { passive: true });
      if (this.panel) {
        this.panel.querySelectorAll('.toc__link').forEach(function(link) {
          link.addEventListener('click', function(event) {
            event.preventDefault();
            self.close();
            self.inlineToc.scrollToHeading(this.hash.substring(1));
          });
        });
      }
    }

    checkVisibility() {
      if (!this.inlineToc) return;
      var visible = window.scrollY > this.inlineToc.offsetTop + this.inlineToc.offsetHeight;
      this.classList.toggle('visible', visible);
      if (!visible) this.close();
    }

    toggle() { this.isOpen ? this.close() : this.open(); }

    open() {
      this.isOpen = true;
      this.classList.add('open');
      if (this.trigger) this.trigger.setAttribute('aria-expanded', 'true');
      ThemeUtils.lockScroll();
    }

    close() {
      this.isOpen = false;
      this.classList.remove('open');
      if (this.trigger) this.trigger.setAttribute('aria-expanded', 'false');
      ThemeUtils.unlockScroll();
    }
  }

  if (!customElements.get('toc-floating')) customElements.define('toc-floating', TocFloating);
})();
