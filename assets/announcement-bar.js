/* -------------------------------------------------------------------------- */
/*                           ANNOUNCEMENT BAR                                 */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

  class AnnouncementBar extends HTMLElement {
    connectedCallback() {
      this.initSwiper();
    }
    initSwiper() {
      var swiperEl = this.querySelector('.announcement-bar__swiper');
      if (!swiperEl) return;
      var slideCount = swiperEl.querySelectorAll('.swiper-slide').length;
      if (slideCount === 0) return;
      if (typeof Swiper === 'undefined') {
        if (!this._retryCount) this._retryCount = 0;
        if (this._retryCount++ < 50) {
          setTimeout(function() {
            this.initSwiper();
          }.bind(this), 100);
        }
        return;
      }
      new Swiper(swiperEl, {
        loop: slideCount > 1,
        speed: 600,
        autoplay: slideCount > 1 ? {
          delay: 4000,
          disableOnInteraction: false,
        } : false,
        effect: 'fade',
        fadeEffect: { crossFade: true },
        navigation: {
          nextEl: '.announcement-bar__nav--next',
          prevEl: '.announcement-bar__nav--prev',
        },
        allowTouchMove: false
      });
    }
  }
  customElements.define('announcement-bar', AnnouncementBar);
})();
