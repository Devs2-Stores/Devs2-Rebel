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
      var section = this.closest('.shopify-section');
      document.documentElement.toggleAttribute('data-sticky-header', isSticky);
      if (section) {
        if (isSticky) {
          section.setAttribute('data-sticky-header-section', 'true');
        } else {
          section.removeAttribute('data-sticky-header-section');
        }
      }
      document.documentElement.style.setProperty('--header-height', headerh + 'px');
      document.documentElement.style.setProperty('--header-height-sticky', isSticky ? headerh + 'px' : '0px');
    }
  }
  if (!customElements.get('global-header')) customElements.define('global-header', Header);
})();
