/* -------------------------------------------------------------------------- */
/*                                  HEADER                                    */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

  var SCROLLED_AT = 8;
  var SCROLL_STEP = 4;

  class Header extends HTMLElement {
    connectedCallback() {
      this.mode = this.dataset.sticky || 'always';
      this.lastY = window.scrollY;
      this.hovered = false;
      this.frame = 0;
      this.hiddenByScroll = false;

      this.onScroll = this.onScroll.bind(this);
      this.onPointerEnter = this.onPointerEnter.bind(this);
      this.onPointerLeave = this.onPointerLeave.bind(this);
      this.onFocusIn = this.onFocusIn.bind(this);
      this.onToggle = this.onToggle.bind(this);

      this.resizeObserver = new ResizeObserver(() => this.setHeightToRoot());
      this.resizeObserver.observe(this);
      var bar = document.querySelector('.announcement-bar-section');
      if (bar) this.resizeObserver.observe(bar);

      window.addEventListener('scroll', this.onScroll, { passive: true });
      this.addEventListener('pointerenter', this.onPointerEnter);
      this.addEventListener('pointerleave', this.onPointerLeave);
      this.addEventListener('focusin', this.onFocusIn);
      this.addEventListener('toggle', this.onToggle, true);
      this.update();
    }

    disconnectedCallback() {
      if (this.resizeObserver) this.resizeObserver.disconnect();
      window.removeEventListener('scroll', this.onScroll);
      if (this.frame) cancelAnimationFrame(this.frame);
    }

    onPointerEnter(event) {
      this.hovered = event.pointerType === 'mouse';
      this.update();
    }

    onPointerLeave() {
      this.hovered = false;
      this.update();
    }

    onFocusIn() {
      this.hiddenByScroll = false;
      this.update();
    }

    onToggle() {
      this.update();
    }

    onScroll() {
      if (this.frame) return;
      this.frame = requestAnimationFrame(() => {
        this.frame = 0;
        this.update();
      });
    }

    isEngaged() {
      return this.hovered || this.matches(':focus-within') || !!this.querySelector('details[open]');
    }

    update() {
      var y = Math.max(window.scrollY, 0);
      var delta = y - this.lastY;
      var engaged = this.isEngaged();

      if (this.mode === 'scroll-up') {
        if (y <= this.offsetHeight || engaged) {
          this.hiddenByScroll = false;
        } else if (delta > SCROLL_STEP) {
          this.hiddenByScroll = true;
        } else if (delta < -SCROLL_STEP) {
          this.hiddenByScroll = false;
        }
      }
      if (Math.abs(delta) > SCROLL_STEP) this.lastY = y;
      var wasHidden = this.hasAttribute('data-hidden');
      this.toggleAttribute('data-hidden', this.hiddenByScroll);
      this.toggleAttribute('data-solid', y > SCROLLED_AT || engaged);
      if (wasHidden !== this.hiddenByScroll) this.setHeightToRoot();
    }

    setHeightToRoot() {
      var headerh = this.getBoundingClientRect().height;
      var isSticky = this.mode !== 'never';
      var section = this.closest('.shopify-section');
      var root = document.documentElement;
      root.toggleAttribute('data-sticky-header', isSticky);
      if (section) {
        if (isSticky) {
          section.setAttribute('data-sticky-header-section', 'true');
        } else {
          section.removeAttribute('data-sticky-header-section');
        }
      }
      var bar = document.querySelector('.announcement-bar-section');
      root.style.setProperty('--announcement-height', (bar ? bar.getBoundingClientRect().height : 0) + 'px');
      root.style.setProperty('--header-height', headerh + 'px');
      root.style.setProperty('--header-height-sticky', isSticky && !this.hiddenByScroll ? headerh + 'px' : '0px');
    }
  }
  if (!customElements.get('global-header')) customElements.define('global-header', Header);
})();
