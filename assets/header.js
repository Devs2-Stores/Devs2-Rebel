/* -------------------------------------------------------------------------- */
/*                                  HEADER                                    */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

  class Header extends HTMLElement {
    connectedCallback() {
      this.setHeightToRoot();
    }
    setHeightToRoot() {
      var headerh = this.getBoundingClientRect().height;
      var isSticky = this.dataset.sticky === 'true';
      document.documentElement.style.setProperty('--header-height', headerh + 'px');
      if (isSticky) document.documentElement.style.setProperty('--header-height-sticky', headerh + 'px');
    }
  }
  customElements.define('global-header', Header);
})();
