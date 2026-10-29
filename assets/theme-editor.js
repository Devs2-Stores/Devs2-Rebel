(function () {
  'use strict';

  if (!(window.Shopify && window.Shopify.designMode)) return;

  var pausedSwipers = new WeakSet();
  var openedDetails = new WeakSet();

  function whenSwiper(host, callback) {
    var tries = 0;
    (function wait() {
      if (host.swiper) return callback(host.swiper);
      if (++tries > 40) return;
      if (tries === 1) {
        host.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        if (window.swiperReady) window.swiperReady(function () {});
      }
      setTimeout(wait, 100);
    })();
  }

  function pauseSwiper(swiper) {
    if (!swiper.params.autoplay || !swiper.autoplay) return;
    if (swiper.autoplay.running) swiper.autoplay.stop();
    pausedSwipers.add(swiper);
  }

  function resumeSwiper(swiper) {
    if (!pausedSwipers.has(swiper)) return;
    pausedSwipers.delete(swiper);
    if (swiper.autoplay && !swiper.autoplay.running) swiper.autoplay.start();
  }

  function showSlide(swiper, slide) {
    var loopIndex = slide.getAttribute('data-swiper-slide-index');
    var index = loopIndex !== null ? Number(loopIndex) : swiper.slides.indexOf(slide);
    if (index < 0) return;
    if (swiper.params.loop) swiper.slideToLoop(index);
    else swiper.slideTo(index);
  }

  function slideOf(block) {
    var slide = block.closest('.swiper-slide');
    var host = slide && slide.closest('.swiper');
    return host ? { slide: slide, host: host } : null;
  }

  function detailsOf(block) {
    return block.matches('details') ? block : block.closest('details');
  }

  function tabTriggerOf(block) {
    var panel = block.closest('[role="tabpanel"]');
    var id = panel && panel.getAttribute('aria-labelledby');
    return id ? document.getElementById(id) : null;
  }

  document.addEventListener('shopify:block:select', function (event) {
    var block = event.target;
    if (!(block instanceof Element)) return;

    var carousel = slideOf(block);
    if (carousel) {
      whenSwiper(carousel.host, function (swiper) {
        pauseSwiper(swiper);
        showSlide(swiper, carousel.slide);
      });
    }

    var trigger = tabTriggerOf(block);
    if (trigger && trigger.getAttribute('aria-selected') !== 'true') trigger.click();

    var details = detailsOf(block);
    if (details && !details.open) {
      details.open = true;
      openedDetails.add(details);
    }
  });

  document.addEventListener('shopify:block:deselect', function (event) {
    var block = event.target;
    if (!(block instanceof Element)) return;

    var carousel = slideOf(block);
    if (carousel && carousel.host.swiper) resumeSwiper(carousel.host.swiper);

    var details = detailsOf(block);
    if (details && openedDetails.has(details)) {
      openedDetails.delete(details);
      details.open = false;
    }
  });

  document.addEventListener('shopify:section:select', function (event) {
    if (!(event.target instanceof Element)) return;
    event.target.querySelectorAll('.swiper').forEach(function (host) {
      if (host.swiper) pauseSwiper(host.swiper);
    });
  });

  document.addEventListener('shopify:section:deselect', function (event) {
    if (!(event.target instanceof Element)) return;
    event.target.querySelectorAll('.swiper').forEach(function (host) {
      if (host.swiper) resumeSwiper(host.swiper);
    });
  });

  document.addEventListener('shopify:section:unload', function (event) {
    if (!(event.target instanceof Element)) return;
    event.target.querySelectorAll('.swiper').forEach(function (host) {
      if (host.swiper) host.swiper.destroy(true, false);
    });
  });
})();
