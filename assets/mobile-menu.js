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
      this.nav = this.querySelector('.mobile-menu__nav') || this.body;

      this.bindEvents();
    }

    disconnectedCallback() {
      if (this._boundEscHandler) document.removeEventListener('keydown', this._boundEscHandler);
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
      this._boundEscHandler = function(e) {
        if (e.key === 'Escape' && this.classList.contains('show')) {
          this.close();
        }
      }.bind(this);
      document.addEventListener('keydown', this._boundEscHandler);
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
      this.querySelectorAll('.mobile-menu__trigger[aria-expanded="true"]').forEach(function(trigger) {
        trigger.setAttribute('aria-expanded', 'false');
      });
      this.syncCoveredLevels();
    }

    syncCoveredLevels() {
      if (!this.nav) return;
      this.nav.querySelectorAll('[data-mobile-menu-covered]').forEach(function(el) {
        el.inert = false;
        el.removeAttribute('data-mobile-menu-covered');
      });
      var open = this.nav.querySelectorAll('.mobile-menu__submenu.is-open');
      var node = open.length ? open[open.length - 1] : null;
      while (node && node !== this.nav) {
        var parent = node.parentElement;
        if (!parent) break;
        Array.prototype.forEach.call(parent.children, function(child) {
          if (child === node) return;
          child.inert = true;
          child.setAttribute('data-mobile-menu-covered', '');
        });
        node = parent;
      }
    }

    openSubmenu(e) {
      var trigger = e.currentTarget;
      var item = trigger.closest('.mobile-menu__item');
      var submenu = item ? item.querySelector('.mobile-menu__submenu') : null;
      if (submenu) {
        submenu.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        this.syncCoveredLevels();
        var back = submenu.querySelector('.mobile-menu__back-btn');
        if (back) back.focus({ preventScroll: true });
      }
    }

    closeSubmenu(e) {
      var btn = e.currentTarget;
      var submenu = btn.closest('.mobile-menu__submenu');
      if (submenu) {
        submenu.classList.remove('is-open');
        var item = submenu.closest('.mobile-menu__item');
        var trigger = item ? item.querySelector('.mobile-menu__trigger') : null;
        this.syncCoveredLevels();
        if (trigger) {
          trigger.setAttribute('aria-expanded', 'false');
          trigger.focus({ preventScroll: true });
        }
      }
    }
  }
  if (!customElements.get('mobile-menu')) customElements.define('mobile-menu', MobileMenu);

  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-action="open-mobile-menu"]');
    if (!btn) return;
    e.preventDefault();
    var mobileMenu = document.querySelector('mobile-menu');
    if (mobileMenu && typeof mobileMenu.open === 'function') {
      mobileMenu.open();
    }
  });
})();
