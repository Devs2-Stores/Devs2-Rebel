/* -------------------------------------------------------------------------- */
/*                                MEGA MENU                                   */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

  class MegaMenu extends HTMLElement {
    connectedCallback() {
      this.container = this.querySelector('.megamenu__container');
      this.list = this.querySelector('.megamenu__list');
      this.arrowLeft = this.querySelector('.megamenu__arrow--left');
      this.arrowRight = this.querySelector('.megamenu__arrow--right');
      this.scrollStep = 200;
      this.scrollOffset = 0;
      this._openItem = null;
      this._hoverCapable = (typeof window.matchMedia === 'function') && window.matchMedia('(hover: hover)').matches;

      if (!this.container || !this.list) return;

      this.bindEvents();
      if ('IntersectionObserver' in window) {
        this._firstLayoutObserver = new IntersectionObserver(function(entries, observer) {
          observer.disconnect();
          this.checkOverflow();
        }.bind(this));
        this._firstLayoutObserver.observe(this.container);
      } else {
        this.checkOverflow();
      }
    }

    disconnectedCallback() {
      if (this._firstLayoutObserver) this._firstLayoutObserver.disconnect();
      if (this._boundResizeHandler) window.removeEventListener('resize', this._boundResizeHandler);
      if (this._boundDocClick) document.removeEventListener('click', this._boundDocClick, true);
      if (this._boundDocKeydown) document.removeEventListener('keydown', this._boundDocKeydown);
      if (this._boundFocusIn) document.removeEventListener('focusin', this._boundFocusIn);
    }

    bindEvents() {
      var self = this;

      if (this.arrowLeft) {
        this.arrowLeft.addEventListener('click', function() {
          self.scroll('left');
        });
      }

      if (this.arrowRight) {
        this.arrowRight.addEventListener('click', function() {
          self.scroll('right');
        });
      }

      // Check overflow on resize
      this._boundResizeHandler = ThemeUtils.debounce(function() {
        self.checkOverflow();
        self.checkAllDropdowns();
      }, 150);
      window.addEventListener('resize', this._boundResizeHandler);

      // Handle dropdown overflow - flip to left if menu item is past 2/3 of viewport
      this.addEventListener('mouseenter', function(e) {
        // Check main dropdown
        var menuItem = e.target.closest('.megamenu__item');
        if (menuItem) {
          self.checkDropdownOverflow(menuItem);
        }

        // Check submenu
        var parent = e.target.closest('.megamenu__simple-parent');
        if (parent) {
          self.checkSubmenuOverflow(parent);
        }
      }, true);

      this.addEventListener('focusin', function(e) {
        var menuItem = e.target.closest('.megamenu__item');
        if (menuItem) self.checkDropdownOverflow(menuItem);

        var parent = e.target.closest('.megamenu__simple-parent');
        if (parent && e.target.parentElement === parent) self.checkSubmenuOverflow(parent);
      });

      this.querySelectorAll('.megamenu__item').forEach(function(item) {
        var trigger = item.querySelector(':scope > .megamenu__trigger[aria-expanded]');
        if (!trigger) return;

        item.addEventListener('mouseenter', function() {
          item.classList.remove('is-dismissed');
          self.syncExpanded(item);
        });
        item.addEventListener('mouseleave', function() {
          if (!item.contains(document.activeElement)) item.classList.remove('is-dismissed');
          self.syncExpanded(item);
        });
        item.addEventListener('focusin', function() {
          self.syncExpanded(item);
        });
        item.addEventListener('focusout', function(e) {
          if (item.contains(e.relatedTarget)) return;
          if (!item.matches(':hover')) item.classList.remove('is-dismissed');
          self.syncExpanded(item, false);
        });
        trigger.addEventListener('click', function() {
          self.checkDropdownOverflow(item);
          item.classList.remove('is-dismissed');
          self.syncExpanded(item);
        });
        item.addEventListener('keydown', function(e) {
          if (e.key !== 'Escape' || item.classList.contains('is-dismissed')) return;
          item.classList.add('is-dismissed');
          trigger.focus();
          self.syncExpanded(item);
        });
      });
    }

    syncExpanded(item, focusInside) {
      var trigger = item.querySelector(':scope > .megamenu__trigger[aria-expanded]');
      if (!trigger) return;
      var inside = typeof focusInside === 'boolean' ? focusInside : item.contains(document.activeElement);
      var open = !item.classList.contains('is-dismissed') && (inside || item.matches(':hover'));
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    checkAllDropdowns() {
      var self = this;
      this.querySelectorAll('.megamenu__item').forEach(function(item) {
        self.checkDropdownOverflow(item);
      });
    }

    checkDropdownOverflow(menuItem) {
      var dropdown = menuItem.querySelector('.megamenu__dropdown');
      if (!dropdown) return;

      // Reset first
      dropdown.classList.remove('is-flipped');

      // Default: left edge of the dropdown sits on the menu item and extends RIGHT.
      // Flipped (right: 0): extends LEFT when the dropdown would pass the viewport's right edge.
      // offsetWidth is 0 while the dropdown is closed and skipped by content-visibility, so
      // this only flips on hover/focus, when the dropdown is being shown.
      var itemRect = menuItem.getBoundingClientRect();
      var gutter = 16;
      if (itemRect.left + dropdown.offsetWidth > window.innerWidth - gutter) {
        dropdown.classList.add('is-flipped');
      }
    }

    checkSubmenuOverflow(parent) {
      var submenu = parent.querySelector('.megamenu__simple-sub');
      if (!submenu) return;

      // Reset first
      submenu.classList.remove('is-flipped');
      parent.classList.remove('is-sub-flipped');

      // Get positions
      var parentRect = parent.getBoundingClientRect();
      var viewportWidth = window.innerWidth;

      // Submenu default: left: 100% (opens to RIGHT)
      // Submenu flipped: right: 100% (opens to LEFT)
      // Flip when parent is past 2/3 of viewport (near right edge)
      var twoThirdsPoint = viewportWidth * (2 / 3);
      if (parentRect.left > twoThirdsPoint) {
        submenu.classList.add('is-flipped');
        parent.classList.add('is-sub-flipped');
      }
    }

    checkOverflow() {
      if (!this.list || !this.container) return;

      var containerWidth = this.container.clientWidth;

      // Calculate actual content width based on last item position
      var items = this.list.querySelectorAll('.megamenu__item');
      var lastItem = items.length > 0 ? items[items.length - 1] : null;
      var listWidth;

      if (lastItem) {
        // Get the right edge of the last item relative to the list
        var listRect = this.list.getBoundingClientRect();
        var lastItemRect = lastItem.getBoundingClientRect();
        listWidth = (lastItemRect.right - listRect.left) + this.scrollOffset;
      } else {
        listWidth = this.list.scrollWidth;
      }

      var isOverflowing = listWidth > containerWidth;
      var maxScroll = Math.max(0, listWidth - containerWidth);

      // Clamp scroll offset
      if (this.scrollOffset > maxScroll) {
        this.scrollOffset = maxScroll;
        this.applyScroll();
      }

      this.updateArrows(isOverflowing, maxScroll);
    }

    updateArrows(isOverflowing, maxScroll) {
      if (!this.arrowLeft || !this.arrowRight) return;

      if (!isOverflowing) {
        this.arrowLeft.hidden = true;
        this.arrowRight.hidden = true;
        this.scrollOffset = 0;
        this.applyScroll();
        return;
      }

      // Show/hide left arrow
      this.arrowLeft.hidden = this.scrollOffset <= 0;

      // Show/hide right arrow (add 5px buffer for rounding)
      this.arrowRight.hidden = this.scrollOffset >= maxScroll - 5;
    }

    applyScroll() {
      if (!this.list) return;
      this.list.style.transform = this.scrollOffset > 0 ? 'translateX(-' + this.scrollOffset + 'px)' : '';
    }

    scroll(direction) {
      if (!this.list || !this.container) return;

      var containerWidth = this.container.clientWidth;

      // Calculate actual content width based on last item position
      var items = this.list.querySelectorAll('.megamenu__item');
      var lastItem = items.length > 0 ? items[items.length - 1] : null;
      var listWidth;

      if (lastItem) {
        var listRect = this.list.getBoundingClientRect();
        var lastItemRect = lastItem.getBoundingClientRect();
        listWidth = (lastItemRect.right - listRect.left) + this.scrollOffset;
      } else {
        listWidth = this.list.scrollWidth;
      }

      var maxScroll = Math.max(0, listWidth - containerWidth);

      if (direction === 'left') {
        this.scrollOffset = Math.max(0, this.scrollOffset - this.scrollStep);
      } else {
        this.scrollOffset = Math.min(maxScroll, this.scrollOffset + this.scrollStep);
      }

      this.applyScroll();
      this.updateArrows(true, maxScroll);
    }
  }
  if (!customElements.get('mega-menu')) customElements.define('mega-menu', MegaMenu);
})();
