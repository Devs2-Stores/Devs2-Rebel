/* -------------------------------------------------------------------------- */
/*                           ANNOUNCEMENT BAR                                 */
/* -------------------------------------------------------------------------- */

(function() {
  'use strict';

  class AnnouncementBar extends HTMLElement {
    connectedCallback() {
      var swiperEl = this.querySelector('.announcement-bar__swiper');
      if (!swiperEl) return;
      var slideCount = swiperEl.querySelectorAll('.swiper-slide').length;
      if (slideCount <= 1) return;
      var self = this;
      (window.swiperReady || function(cb){ cb(); })(function(){
        self.initSwiper(swiperEl, slideCount);
      });
    }
    initSwiper(swiperEl, slideCount) {
      new Swiper(swiperEl, {
        loop: true,
        speed: 600,
        autoplay: { delay: 4000, disableOnInteraction: false },
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
  if (!customElements.get('announcement-bar')) customElements.define('announcement-bar', AnnouncementBar);
})();
