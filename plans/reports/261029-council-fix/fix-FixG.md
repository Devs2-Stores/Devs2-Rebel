# FixG: motion tokens

## 1. Bare easings -> tokens: done
38 declarations replaced across 31 files (`var(--transition-fast)` for 150-200ms literals/`--duration-default`, `--transition-base` for 250-400ms/`--duration-medium`, `--transition-slow` for `--duration-long`).
Files: assets/{countdown-banner,page-faq,page-stores:161,product:697/1267/1273/1310,quickview-modal:13/19/33/57,search-modal:45,section-banner-hotspots:33/53,section-collapsible-content:46/49,section-featured-collection,section-hero,section-image-text-overlay,section-image-with-text,section-layered-images,section-multicolumn,section-newsletter,section-parallax-image,section-promotion-banner,section-rich-text,section-tabs,section-team,section-video}.css; sections/header.liquid:114; snippets/mobile-menu.liquid:113/118/132/148/256; snippets/product-card.liquid:441.
Overlay drawers/modals (mobile menu, header drawer transform, search modal, quick view, size guide) now use `--transition-base` (carries `--ease-out`).
Verify: re-ran the task's `rg`; node --check; validate-locales, validate-schema-ranges, settings-usage all SUCCESS; curl 127.0.0.1:9292 = 200.

Remaining matches of the rg pattern (all intentional):
- `visibility 0s linear <delay>` (cart-modal:12, product:1267/1273, quickview:13/19, mobile-menu:113/256): the `linear` is the zero-duration visibility delay for focus timing (DESIGN: time the visibility change), not motion.
- page-stores.css:170 shimmer `ease-in-out infinite`, section-banner-hotspots.css:41 hotspot-ping `ease-out infinite`: continuous loops.
- Other editor's files, skipped: collection.css:250/1433 (only visibility-linear, already tokenised), footer.css:377/413 (`ease` x4), section-marquee-products.css:70 (`ease` x3), section-blog-posts/gallery/slideshow (already `var(--ease-out)`, not bare; slideshow:165 `0.6s ease` is gone from the grep so already changed), section-collection-list.css:52 (`0.6s ease`, not matched now, so already handled by the other editor).
- swiper.css (vendor) and `spin ... linear infinite` spinners untouched.
Net bare easings left in my files: 0 (2 intentional infinite loops). Left for other editor: footer.css:377,413, section-marquee-products.css:70.

## 2. Cart drawer dim: done
assets/cart-modal.css:276 `transition: opacity var(--transition-fast)` on `.cart-modal-items-list`.

## 3. Quick view open/close: done
- assets/quickview-modal.css:15-23: open state moved from `:not(.hidden)` to `.is-open`; `.hidden` stays `display:none`; the panel keeps its `translateX(110%)` start. Overlay transition now `--transition-base`.
- assets/quickview-modal.js: `open()` removes `hidden`, forces reflow (`void this.offsetWidth`), adds `is-open`, then lockScroll/trapFocus; `close()` removes `is-open`, re-adds `hidden` after `_closeDelay()` (reads the panel's computed transition-duration, fallback 300ms). A pending close timer is cleared on reopen and on disconnect. Dead `scale-*`/`opacity-*` toggles removed. Escape, overlay click, focus trap/release unchanged.
- Known gap: static only, not exercised in a browser.

## 4. Description toggle: done
assets/product.js:228-242 (+217-226 helpers): click sets the inline max-height to the current rendered px, reflows, flips state, then sets the end px (`scrollHeight` on expand, `data-max-height` on collapse). Inline style is cleared on `transitionend` (max-height) or after a 450ms fallback, so later growth is not clipped. Re-clicking mid-animation starts from the current height. `aria-expanded` and labels are still handled by `render()`. product.css already had `transition: max-height var(--transition-base)` on the content (line 727), so no CSS change was needed.
Known gap: static only, not exercised in a browser.
