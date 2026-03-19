(function() {
  'use strict';

  function parseDateTimeVI(timeStr) {
    if (!timeStr) return null;
    var parts = timeStr.split('/');
    if (parts.length < 3) return null;
    var datePart = parts[2].split(' ');
    var timePart = (datePart[1] || '0:0:0').split(':');
    return new Date(
      parseInt(datePart[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[0], 10),
      parseInt(timePart[0], 10) || 0,
      parseInt(timePart[1], 10) || 0,
      parseInt(timePart[2], 10) || 0
    ).getTime();
  }

  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function darkenHex(hex, factor) {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return hex;
    factor = factor || 0.7;
    var r = Math.max(0, Math.floor(parseInt(hex.slice(1, 3), 16) * factor));
    var g = Math.max(0, Math.floor(parseInt(hex.slice(3, 5), 16) * factor));
    var b = Math.max(0, Math.floor(parseInt(hex.slice(5, 7), 16) * factor));
    return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
  }

  function initProductBannerTabs() {
    var container = document.querySelector('.section_index--product-banner');
    if (!container) return;

    container.addEventListener('click', function(e) {
      var tab = e.target.closest('.section_index--product-banner-tab');
      if (!tab) return;

      var tabId = tab.getAttribute('data-tab');
      var allTabbable = container.querySelectorAll('[data-tab]');

      for (var i = 0; i < allTabbable.length; i++) {
        var el = allTabbable[i];
        if (el.getAttribute('data-tab') === tabId) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });
  }

  function initSliderSwiper() {
    if (typeof Swiper === 'undefined') return;
    var el = document.querySelector('.section-slider-swiper');
    if (!el) return;

    new Swiper('.section-slider-swiper', {
      loop: true,
      speed: 800,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false
      },
      pagination: {
        el: '.section-slider-pagination',
        clickable: true,
        renderBullet: function(index, className) {
          return '<span class="' + className + '"><span class="pagination-progress"></span></span>';
        }
      }
    });
  }

  function initProductsSliderSwiper() {
    if (typeof Swiper === 'undefined') return;
    var el = document.querySelector('.section-products-slider-swiper');
    if (!el) return;

    new Swiper('.section-products-slider-swiper', {
      slidesPerView: 1,
      spaceBetween: 10,
      loop: true,
      speed: 800,
      breakpoints: {
        640: {
          slidesPerView: 2,
          spaceBetween: 8
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 12
        },
        1280: {
          slidesPerView: 4,
          spaceBetween: 16
        }
      },
      navigation: {
        nextEl: '.section-products-slider-button-next',
        prevEl: '.section-products-slider-button-prev'
      }
    });
  }

  function initCountdownVI() {
    var elements = document.querySelectorAll('.countdownLoop-vi');
    if (elements.length === 0) return;

    setInterval(function() {
      var now = Date.now();

      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        var target = parseDateTimeVI(el.getAttribute('data-time'));
        if (!target) continue;

        var distance = Math.max(0, target - now);
        var days = Math.floor(distance / 86400000);
        var hours = Math.floor((distance % 86400000) / 3600000);
        var minutes = Math.floor((distance % 3600000) / 60000);
        var seconds = Math.floor((distance % 60000) / 1000);

        var color = el.style.getPropertyValue('--countdown-color') || '#F30';
        var textColor = el.style.getPropertyValue('--countdown-text-color') || '#F9F9F9';
        var darker = darkenHex(color);
        var style = 'style="background:linear-gradient(135deg,' + color + ' 0%,' + darker + ' 100%);color:' + textColor + ';"';

        el.innerHTML =
          '<span class="countdown-item" ' + style + '><b>' + pad(days) + '</b>Ngày</span>' +
          '<span class="countdown-item" ' + style + '><b>' + pad(hours) + '</b>Giờ</span>' +
          '<span class="countdown-item" ' + style + '><b>' + pad(minutes) + '</b>Phút</span>' +
          '<span class="countdown-item" ' + style + '><b>' + pad(seconds) + '</b>Giây</span>';
      }
    }, 1000);
  }

  function initFlashSaleSwiper() {
    if (typeof Swiper === 'undefined') return;
    var el = document.querySelector('.section-flash-sale__swiper');
    if (!el) return;

    new Swiper('.section-flash-sale__swiper', {
      slidesPerView: 1.2,
      spaceBetween: 16,
      speed: 600,
      freeMode: true,
      breakpoints: {
        480: {
          slidesPerView: 1.5,
          spaceBetween: 16
        },
        640: {
          slidesPerView: 2.2,
          spaceBetween: 20
        },
        1024: {
          slidesPerView: 3.2,
          spaceBetween: 24
        },
        1280: {
          slidesPerView: 4.2,
          spaceBetween: 24
        }
      }
    });
  }

  function initHomeBlogSwiper() {
    if (typeof Swiper === 'undefined') return;
    var el = document.querySelector('.section-home-blog__swiper');
    if (!el) return;

    new Swiper('.section-home-blog__swiper', {
      slidesPerView: 1.2,
      spaceBetween: 12,
      speed: 600,
      breakpoints: {
        480: {
          slidesPerView: 1.5,
          spaceBetween: 16
        },
        640: {
          slidesPerView: 2.2,
          spaceBetween: 16
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 20
        },
        1280: {
          slidesPerView: 4,
          spaceBetween: 24
        }
      },
      navigation: {
        nextEl: '.section-home-blog__nav-next',
        prevEl: '.section-home-blog__nav-prev'
      }
    });
  }
  
  function initFlashSaleCountdown() {
    var panels = document.querySelectorAll('[data-flash-countdown]');
    var bgTimers = document.querySelectorAll('[data-flash-bg-timer]');
    if (panels.length === 0 && bgTimers.length === 0) return;

    setInterval(function() {
      var now = Date.now();

      for (var i = 0; i < panels.length; i++) {
        var panel = panels[i];
        var target = parseDateTimeVI(panel.getAttribute('data-time'));
        if (!target) continue;
        var distance = Math.max(0, target - now);
        var hrs = Math.floor(distance / 3600000);
        var min = Math.floor((distance % 3600000) / 60000);
        var sec = Math.floor((distance % 60000) / 1000);

        var hrsEl = panel.querySelector('[data-flash-hrs]');
        var minEl = panel.querySelector('[data-flash-min]');
        var secEl = panel.querySelector('[data-flash-sec]');
        if (hrsEl) hrsEl.textContent = pad(hrs);
        if (minEl) minEl.textContent = pad(min);
        if (secEl) secEl.textContent = pad(sec);
      }

      for (var j = 0; j < bgTimers.length; j++) {
        var el = bgTimers[j];
        var target2 = parseDateTimeVI(el.getAttribute('data-time'));
        if (!target2) continue;
        var dist = Math.max(0, target2 - now);
        var h = Math.floor(dist / 3600000);
        var m = Math.floor((dist % 3600000) / 60000);
        var s = Math.floor((dist % 60000) / 1000);
        el.textContent = pad(h) + ':' + pad(m) + ':' + pad(s);
      }
    }, 1000);
  }

  function initLookbookHotspots() {
    var section = document.querySelector('.section-lookbook');
    if (!section) return;
    var hotspots = section.querySelectorAll('.section-lookbook__hotspot');
    if (hotspots.length === 0) return;

    function updateTooltipFlip() {
      for (var i = 0; i < hotspots.length; i++) {
        var left = parseFloat(hotspots[i].style.left);
        if (left > 55) {
          hotspots[i].setAttribute('data-tooltip-flip', '');
        } else {
          hotspots[i].removeAttribute('data-tooltip-flip');
        }
      }
    }

    updateTooltipFlip();
    window.addEventListener('resize', ThemeUtils.debounce(updateTooltipFlip, 200));
  }

  function initScrollFadeUp() {
    var elements = document.querySelectorAll('.scroll-fade-up');
    if (elements.length === 0) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    elements.forEach(function(el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        el.classList.add('is-visible');
      } else {
        observer.observe(el);
      } 
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    initProductBannerTabs();
    initSliderSwiper();
    initProductsSliderSwiper();
    initCountdownVI();
    initFlashSaleSwiper();
    initHomeBlogSwiper();
    initFlashSaleCountdown();
    initLookbookHotspots();
    initScrollFadeUp();
  });

})();