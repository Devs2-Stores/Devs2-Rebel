/* -------------------------------------------------------------------------- */
/*                              MOBILE MENU                                   */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

  class MobileMenu extends HTMLElement {
    connectedCallback() {
      this.overlay = this.querySelector('.mobile-menu__overlay');
      this.closeBtn = this.querySelector('.mobile-menu__close');
      this.drawer = this.querySelector('.mobile-menu__drawer');
      this.body = this.querySelector('.mobile-menu__body');

      this.bindEvents();
    }

    bindEvents() {
      // Close events
      if (this.overlay) {
        this.overlay.addEventListener('click', this.close.bind(this));
      }
      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', this.close.bind(this));
      }

      // Submenu triggers
      this.querySelectorAll('.mobile-menu__trigger').forEach(function(trigger) {
        trigger.addEventListener('click', this.openSubmenu.bind(this));
      }.bind(this));

      // Back buttons
      this.querySelectorAll('.mobile-menu__back-btn').forEach(function(btn) {
        btn.addEventListener('click', this.closeSubmenu.bind(this));
      }.bind(this));

      // Escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && this.classList.contains('show')) {
          this.close();
        }
      }.bind(this));
    }

    open() {
      this.classList.add('show');
      ThemeUtils.lockScroll();
      this.setAttribute('aria-hidden', 'false');
      ThemeUtils.trapFocus(this);
    }

    close() {
      this.classList.remove('show');
      ThemeUtils.unlockScroll();
      this.setAttribute('aria-hidden', 'true');
      ThemeUtils.releaseFocus(this);
      // Reset all submenus
      this.querySelectorAll('.mobile-menu__submenu.is-open').forEach(function(submenu) {
        submenu.classList.remove('is-open');
      });
    }

    openSubmenu(e) {
      var trigger = e.currentTarget;
      var item = trigger.closest('.mobile-menu__item');
      var submenu = item ? item.querySelector('.mobile-menu__submenu') : null;
      if (submenu) {
        submenu.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    }

    closeSubmenu(e) {
      var btn = e.currentTarget;
      var submenu = btn.closest('.mobile-menu__submenu');
      if (submenu) {
        submenu.classList.remove('is-open');
        var item = submenu.closest('.mobile-menu__item');
        var trigger = item ? item.querySelector('.mobile-menu__trigger') : null;
        if (trigger) {
          trigger.setAttribute('aria-expanded', 'false');
        }
      }
    }
  }
  customElements.define('mobile-menu', MobileMenu);

  // Mobile menu open handler
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-action="open-mobile-menu"]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var mobileMenu = document.querySelector('mobile-menu');
        if (mobileMenu && typeof mobileMenu.open === 'function') {
          mobileMenu.open();
        }
      });
    });
  });
})();
