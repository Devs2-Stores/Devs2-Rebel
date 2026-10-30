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
        if (!self.isConnected || self.swiper) return;
        self.initSwiper(swiperEl);
      }, swiperEl);
    }
    disconnectedCallback() {
      if (this.listeners) {
        this.listeners.abort();
        this.listeners = null;
      }
      if (this.swiper) {
        this.swiper.destroy(true, true);
        this.swiper = null;
      }
    }
    initSwiper(swiperEl) {
      var swiper = new Swiper(swiperEl, {
        rewind: true,
        speed: 600,
        autoplay: { delay: 4000, disableOnInteraction: false },
        effect: 'fade',
        fadeEffect: { crossFade: true },
        navigation: {
          nextEl: this.querySelector('.announcement-bar__nav--next'),
          prevEl: this.querySelector('.announcement-bar__nav--prev'),
        },
        allowTouchMove: false
      });
      this.swiper = swiper;
      this.listeners = new AbortController();
      var signal = this.listeners.signal;

      var syncHiddenSlides = function() {
        swiper.slides.forEach(function(slide, index) {
          slide.inert = index !== swiper.activeIndex;
        });
      };
      syncHiddenSlides();
      swiper.on('slideChange', syncHiddenSlides);

      var host = this;
      var rotationBtn = this.querySelector('[data-announcement-rotation]');
      var pauseLabel = rotationBtn ? rotationBtn.getAttribute('data-label-pause') : '';
      var playLabel = rotationBtn ? rotationBtn.getAttribute('data-label-play') : '';
      var holds = { pointer: false, focus: false, user: false };

      var setHold = function(key, value) {
        holds[key] = value;
        var held = holds.pointer || holds.focus || holds.user;
        if (held && swiper.autoplay.running) swiper.autoplay.stop();
        else if (!held && !swiper.autoplay.running) swiper.autoplay.start();
      };

      swiper.on('autoplayStop', function() {
        swiper.wrapperEl.setAttribute('aria-live', 'polite');
      });
      swiper.on('autoplayStart', function() {
        swiper.wrapperEl.setAttribute('aria-live', 'off');
      });

      this.addEventListener('pointerenter', function(event) {
        if (event.pointerType === 'mouse') setHold('pointer', true);
      }, { signal: signal });
      this.addEventListener('pointerleave', function(event) {
        if (event.pointerType === 'mouse') setHold('pointer', false);
      }, { signal: signal });
      this.addEventListener('focusin', function(event) {
        setHold('focus', !(rotationBtn && rotationBtn.contains(event.target)));
      }, { signal: signal });
      this.addEventListener('focusout', function(event) {
        if (!host.contains(event.relatedTarget)) setHold('focus', false);
      }, { signal: signal });

      if (rotationBtn) {
        rotationBtn.hidden = false;
        rotationBtn.addEventListener('click', function() {
          var stop = !holds.user;
          rotationBtn.setAttribute('aria-label', stop ? playLabel : pauseLabel);
          host.classList.toggle('is-rotation-user-stopped', stop);
          setHold('user', stop);
        }, { signal: signal });
      }
    }
  }
  if (!customElements.get('announcement-bar')) customElements.define('announcement-bar', AnnouncementBar);
})();
