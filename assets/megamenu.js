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

      if (!this.container || !this.list) return;

      this.bindEvents();
      this.checkOverflow();
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
      window.addEventListener('resize', ThemeUtils.debounce(function() {
        self.checkOverflow();
        self.checkAllDropdowns();
      }, 150));

      // Handle dropdown overflow - flip to left if menu item is past 2/3 of viewport
      this.addEventListener('mouseenter', function(e) {
        // Check main dropdown
        var menuItem = e.target.closest('.megamenu__item');
        if (menuItem) {
          self.checkDropdownOverflow(menuItem);
        }

        // Check submenu
        var parent = e.target.closest('.megamenu__simple-parent, .megamenu__link-parent');
        if (parent) {
          self.checkSubmenuOverflow(parent);
        }
      }, true);

      // Initial check for all dropdowns
      this.checkAllDropdowns();
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

      // Get positions
      var itemRect = menuItem.getBoundingClientRect();
      var viewportWidth = window.innerWidth;
      var triggerCenter = itemRect.left + itemRect.width / 2;

      // Default: right: 0 (dropdown extends LEFT from menu item) - good for right-side items
      // Flipped: left: 0 (dropdown extends RIGHT from menu item) - good for left-side items
      // Only flip for menu items in the LEFT 1/3 of viewport
      var oneThirdPoint = viewportWidth / 3;
      if (itemRect.left < oneThirdPoint) {
        dropdown.classList.add('is-flipped');
        // Arrow offset from left edge = trigger center - dropdown left (which is item left)
        dropdown.style.setProperty('--arrow-offset', Math.round(triggerCenter - itemRect.left) + 'px');
      } else {
        // Arrow offset from right edge = dropdown right (which is item right) - trigger center
        dropdown.style.setProperty('--arrow-offset', Math.round(itemRect.right - triggerCenter) + 'px');
      }
    }

    checkSubmenuOverflow(parent) {
      var submenu = parent.querySelector('.megamenu__simple-sub, .megamenu__sublinks');
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
  customElements.define('mega-menu', MegaMenu);
})();
