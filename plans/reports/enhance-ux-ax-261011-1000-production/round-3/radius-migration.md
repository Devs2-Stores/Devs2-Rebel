# Radius Token Migration Report (Round 3)

## 1. Migration Inventory (129 rules across 35 files)

| File | Selector | Old Value | New Token | Class |
|---|---|---|---|---|
| assets/article.css | `.article-template__media-image` | `var(--radius-sm)` | `var(--media-radius)` | media |
| assets/article.css | `.article-template__content img` | `var(--radius-md)` | `var(--media-radius)` | media |
| assets/article.css | `.article-template__content code` | `var(--radius-sm, 4px)` | `var(--text-boxes-radius)` | text-box |
| assets/article.css | `.article-template__content pre` | `var(--radius-md)` | `var(--text-boxes-radius)` | text-box |
| assets/article.css | `.article-template__content iframe` | `var(--radius-md)` | `var(--media-radius)` | media |
| assets/article.css | `.article-template__comments-input, .article-template__comments-textarea` | `var(--radius-md)` | `var(--inputs-radius)` | input |
| assets/article.css | `.article-template__comments-item` | `var(--radius-md)` | `var(--text-boxes-radius)` | text-box |
| assets/article.css | `/* Moderation notice */ .article-template__comments-moderated` | `var(--radius-sm)` | `var(--text-boxes-radius)` | text-box |
| assets/article.css | `/* Success message */ .article-template__comments-success` | `var(--radius-md)` | `var(--text-boxes-radius)` | text-box |
| assets/article.css | `/* Error message */ .article-template__comments-errors` | `var(--radius-md)` | `var(--text-boxes-radius)` | text-box |
| assets/article.css | `/* Empty state */ .article-template__comments-empty` | `var(--radius-md)` | `var(--text-boxes-radius)` | text-box |
| assets/article.css | `.article-template__nav-link` | `var(--radius-md)` | `var(--card-corner-radius)` | card |
| assets/article.css | `.article-template__nav-thumb` | `var(--radius-sm)` | `var(--media-radius)` | media |
| assets/article.css | `.article-template__nav-back` | `var(--radius-lg)` | `var(--buttons-radius)` | button |
| assets/base.css | `.swatch--square` | `0.25rem` | `0.25rem (keep)` | keep |
| assets/blog.css | `.blog-featured__card` | `var(--radius-md)` | `var(--card-corner-radius)` | card |
| assets/blog.css | `.blog-template__empty` | `var(--radius-md)` | `var(--text-boxes-radius)` | text-box |
| assets/blog.css | `.blog-template__empty-link` | `var(--radius-md)` | `var(--buttons-radius)` | button |
| assets/blog.css | `.blog-sidebar__link` | `2px` | `var(--buttons-radius)` | button |
| assets/blog.css | `.blog-sidebar__recent-post-image` | `var(--radius-sm)` | `var(--media-radius)` | media |
| assets/blog.css | `.blog-sidebar__banner` | `var(--radius-md)` | `var(--media-radius)` | media |
| assets/blog.css | `.blog-sidebar__banner-button` | `var(--radius-sm)` | `var(--buttons-radius)` | button |
| assets/countdown-banner.css | ` COUNTDOWN BANNER ═══════════════════════════════════════════════════ */ .countdown-banner` | `0.75rem` | `var(--text-boxes-radius)` | text-box |
| assets/countdown-banner.css | `/* ── Media (optional image) ── */ .countdown-banner__media` | `0.75rem` | `var(--media-radius)` | media |
| assets/countdown-banner.css | `.countdown-banner__image` | `0.75rem` | `var(--media-radius)` | media |
| assets/countdown-banner.css | `.countdown-banner__unit` | `0.5rem` | `var(--text-boxes-radius)` | text-box |
| assets/customer.css | `══════════════ */ /* ── Sidebar ───────────────────────────────────── */ .customer-sidebar` | `0.5rem` | `var(--text-boxes-radius)` | text-box |
| assets/customer.css | `.customer-sidebar__link` | `0.375rem` | `var(--buttons-radius)` | button |
| assets/customer.css | `.login-template__wrapper` | `0.75rem` | `var(--text-boxes-radius)` | text-box |
| assets/customer.css | `.login-template__content` | `2rem 2rem 0 0` | `var(--text-boxes-radius) var(--text-boxes-radius) 0 0` | text-box |
| assets/customer.css | `@media (min-width: 1280px) { .login-template__content` | `0 0 0 2rem` | `0 0 0 var(--text-boxes-radius)` | text-box |
| assets/customer.css | `.register-template__wrapper` | `0.75rem` | `var(--text-boxes-radius)` | text-box |
| assets/customer.css | `.register-template__content` | `2rem 2rem 0 0` | `var(--text-boxes-radius) var(--text-boxes-radius) 0 0` | text-box |
| assets/customer.css | `@media (min-width: 1280px) { .register-template__content` | `0 0 0 2rem` | `0 0 0 var(--text-boxes-radius)` | text-box |
| assets/customer.css | `.account-template__wrapper` | `0.75rem` | `var(--text-boxes-radius)` | text-box |
| assets/customer.css | `.account-template__order-item, .account-template__address-item` | `0.5rem` | `var(--card-corner-radius)` | card |
| assets/customer.css | `.account-template__order-item-name .order-detail-link` | `0.25rem` | `var(--buttons-radius)` | button |
| assets/customer.css | `.account-template__product-image img` | `0.25rem` | `var(--media-radius)` | media |
| assets/customer.css | `.account-template__address-badge` | `0.25rem` | `var(--badge-corner-radius)` | badge |
| assets/customer.css | `.account-template__order-table-wrapper` | `0.5rem` | `var(--text-boxes-radius)` | text-box |
| assets/customer.css | `.account-template__order-table tr` | `.5rem` | `var(--text-boxes-radius)` | text-box |
| assets/customer.css | `.account-template__address-card` | `0.5rem` | `var(--card-corner-radius)` | card |
| assets/customer.css | `.activate-account-template__wrapper, .reset-password-template__wrapper` | `0.75rem` | `var(--text-boxes-radius)` | text-box |
| assets/customer.css | `.change-password-template__wrapper` | `0.75rem` | `var(--text-boxes-radius)` | text-box |
| assets/customer.css | `.addresses-template__wrapper` | `0.75rem` | `var(--text-boxes-radius)` | text-box |
| assets/customer.css | `.addresses-template__item` | `0.5rem` | `var(--card-corner-radius)` | card |
| assets/customer.css | `.addresses-template__badge` | `0.25rem` | `var(--badge-corner-radius)` | badge |
| assets/customer.css | `.orders-template__wrapper` | `0.75rem` | `var(--text-boxes-radius)` | text-box |
| assets/customer.css | `.orders-template__item` | `0.5rem` | `var(--card-corner-radius)` | card |
| assets/customer.css | `.orders-template__product-image img` | `0.25rem` | `var(--media-radius)` | media |
| assets/customer.css | `.order-template__wrapper` | `0.75rem` | `var(--text-boxes-radius)` | text-box |
| assets/customer.css | `.order-template__detail-item` | `0.5rem` | `var(--card-corner-radius)` | card |
| assets/customer.css | `.order-template__product-image img` | `0.25rem` | `var(--media-radius)` | media |
| assets/float-social.css | `.float-social__list::-webkit-scrollbar-thumb` | `4px` | `4px (keep)` | keep |
| assets/gift-card.css | `.gift-card__shell` | `24px` | `var(--text-boxes-radius)` | text-box |
| assets/gift-card.css | `.gift-card__qr` | `16px` | `var(--text-boxes-radius)` | text-box |
| assets/gift-card.css | `.gift-card__code` | `12px` | `var(--text-boxes-radius)` | text-box |
| assets/list-collections.css | `.collection-card` | `var(--radius-md)` | `var(--card-corner-radius)` | card |
| assets/list-collections.css | `.collection-card__image` | `calc(var(--radius-md) - 2px)` | `var(--media-radius)` | media |
| assets/list-collections.css | `.collection-grid__empty` | `var(--radius-md)` | `var(--text-boxes-radius)` | text-box |
| assets/megamenu.css | `.megamenu__item .megamenu__dropdown` | `var(--radius-lg)` | `var(--popup-corner-radius)` | popup |
| assets/megamenu.css | ` .megamenu__grid .megamenu__columns .megamenu__column .megamenu__links .megamenu__sublinks` | `var(--radius-md)` | `var(--popup-corner-radius)` | popup |
| assets/megamenu.css | `egamenu__columns .megamenu__column .megamenu__links .megamenu__sublinks .megamenu__sublink` | `var(--radius-sm)` | `var(--popup-corner-radius)` | popup |
| assets/megamenu.css | `own .megamenu__dropdown-inner .megamenu__grid .megamenu__featured .megamenu__featured-link` | `var(--radius-md)` | `var(--card-corner-radius)` | card |
| assets/megamenu.css | `ner .megamenu__grid .megamenu__featured .megamenu__featured-link .megamenu__featured-image` | `var(--radius-md)` | `var(--media-radius)` | media |
| assets/megamenu.css | ` .megamenu__dropdown .megamenu__dropdown-inner .megamenu__simple .megamenu__simple-sublink` | `var(--radius-sm)` | `var(--popup-corner-radius)` | popup |
| assets/megamenu.css | `item .megamenu__dropdown .megamenu__dropdown-inner .megamenu__simple .megamenu__simple-sub` | `var(--radius-md)` | `var(--popup-corner-radius)` | popup |
| assets/megamenu.css | `.megamenu--fullwidth .megamenu__dropdown` | `0 0 var(--radius-lg) var(--radius-lg)` | `0 0 var(--popup-corner-radius) var(--popup-corner-radius)` | popup |
| assets/page-about.css | `.about-hero__button` | `var(--radius-sm)` | `var(--buttons-radius)` | button |
| assets/page-about.css | `.about-mission__wrap` | `var(--radius-lg)` | `var(--text-boxes-radius)` | text-box |
| assets/page-about.css | `@media (max-width: 768px) { .about-mission__wrap` | `var(--radius-md)` | deleted (inherits var(--text-boxes-radius)) | text-box |
| assets/page-about.css | `.about-features__item-image` | `var(--radius-lg)` | `var(--media-radius)` | media |
| assets/page-about.css | `.about-story__wrap` | `var(--radius-lg)` | `var(--text-boxes-radius)` | text-box |
| assets/page-about.css | `@media (max-width: 768px) { .about-story__wrap` | `var(--radius-md)` | deleted (inherits var(--text-boxes-radius)) | text-box |
| assets/page-about.css | `.about-actions__item` | `var(--radius-md)` | `var(--card-corner-radius)` | card |
| assets/page-about.css | `.about-gallery__item` | `var(--radius-md)` | `var(--media-radius)` | media |
| assets/page-about.css | `.about-content__wrap img` | `var(--radius-md)` | `var(--media-radius)` | media |
| assets/page-contact.css | `.contact-main__info-panel` | `var(--radius-lg)` | `var(--text-boxes-radius)` | text-box |
| assets/page-contact.css | `.contact-main__info-stat` | `var(--radius-md)` | `var(--text-boxes-radius)` | text-box |
| assets/page-contact.css | `.contact-main__info-note` | `var(--radius-md)` | `var(--text-boxes-radius)` | text-box |
| assets/page-contact.css | `.contact-main__form` | `var(--radius-lg)` | `var(--text-boxes-radius)` | text-box |
| assets/page-contact.css | `.contact-form__success, .contact-form__error` | `var(--radius-md)` | `var(--text-boxes-radius)` | text-box |
| assets/page-faq.css | `.faq-item` | `var(--radius-lg)` | `var(--text-boxes-radius)` | text-box |
| assets/page-faq.css | `.faq-empty, .faq-editor-empty` | `var(--radius-lg)` | `var(--text-boxes-radius)` | text-box |
| assets/page-stores.css | `.stores-sidebar__inner` | `var(--radius-lg)` | `var(--text-boxes-radius)` | text-box |
| assets/page-stores.css | `.stores-sidebar__search-box` | `var(--radius-md)` | `var(--inputs-radius)` | input |
| assets/page.css | `.page-default__content blockquote` | `var(--radius-sm)` | `var(--text-boxes-radius)` | text-box |
| assets/page.css | `.page-default__content img, .page-default__content video, .page-default__content iframe` | `var(--radius-md)` | `var(--media-radius)` | media |
| assets/page.css | `.page-default__content code` | `var(--radius-sm)` | `var(--text-boxes-radius)` | text-box |
| assets/page.css | `.page-default__content pre` | `var(--radius-md)` | `var(--text-boxes-radius)` | text-box |
| assets/page.css | `/* ── Empty Placeholder ─────────────────────────── */ .page-default__placeholder` | `var(--radius-lg)` | `var(--text-boxes-radius)` | text-box |
| assets/search.css | `.search-template__input-group` | `var(--radius-lg)` | `var(--inputs-radius)` | input |
| assets/search.css | `.search-template__submit` | `var(--radius-md)` | `var(--buttons-radius)` | button |
| assets/search.css | `.search-template__tabs` | `calc(var(--radius-lg) + 2px)` | `var(--buttons-radius-outset)` | button |
| assets/search.css | `.search-template__tab` | `var(--radius-md)` | `var(--buttons-radius)` | button |
| assets/search.css | `.search-page-result` | `var(--radius-md)` | `var(--card-corner-radius)` | card |
| assets/search.css | `sults ────────────────────────── */ .search-template__empty, .search-template__placeholder` | `var(--radius-lg)` | `var(--text-boxes-radius)` | text-box |
| assets/search.css | `.search-template__empty-suggestions` | `var(--radius-md)` | `var(--text-boxes-radius)` | text-box |
| assets/share-buttons.css | `.share-buttons__item a, .share-buttons__item button` | `var(--radius-sm, 4px)` | `var(--buttons-radius)` | button |
| assets/skip-to-content-link.css | `.skip-to-content-link:focus` | `var(--radius-sm)` | `var(--buttons-radius)` | button |
| assets/theme.css | `table` | `var(--radius-sm)` | `var(--text-boxes-radius)` | text-box |
| assets/theme.css | `.swiper-custom-forSlider.swiper-horizontal .swiper-pagination .swiper-pagination-bullet` | `0.25rem` | `0.25rem (keep)` | keep |
| assets/toast.css | `.toast` | `var(--radius-sm)` | `var(--popup-corner-radius)` | popup |
| sections/banner-hotspots.liquid | `.section-hotspot__wrapper` | `0.5rem` | `var(--media-radius)` | media |
| sections/banner-hotspots.liquid | `.section-hotspot__tooltip` | `0.5rem` | `var(--popup-corner-radius)` | popup |
| sections/banner-hotspots.liquid | `.section-hotspot__tooltip-img` | `0.25rem` | `var(--media-radius)` | media |
| sections/before-after.liquid | `.section-compare__wrapper` | `0.5rem` | `var(--media-radius)` | media |
| sections/before-after.liquid | `.section-compare__label` | `4px` | `var(--badge-corner-radius)` | badge |
| sections/blog-posts.liquid | `.section-blog-posts__media` | `0.5rem` | `var(--media-radius)` | media |
| sections/collection-list.liquid | `.section-collection-list__card` | `0.5rem` | `var(--card-corner-radius)` | card |
| sections/contact-form.liquid | `.section-contact-form__info` | `0.75rem` | `var(--text-boxes-radius)` | text-box |
| sections/contact-form.liquid | `.section-contact-form__info-item` | `0.75rem` | `var(--text-boxes-radius)` | text-box |
| sections/contact-form.liquid | `.section-contact-form__form-wrap` | `0.75rem` | `var(--text-boxes-radius)` | text-box |
| sections/contact-form.liquid | `.section-contact-form__submit` | `var(--radius-sm)` | `var(--buttons-radius)` | button |
| sections/featured-collection.liquid | `/* ── Placeholder ── */ .section-featured-collection__placeholder` | `0.5rem` | `var(--media-radius)` | media |
| sections/featured-product.liquid | `.section-featured-product__media` | `0.5rem` | `var(--media-radius)` | media |
| sections/gallery.liquid | `.section-gallery__item` | `0.25rem` | `var(--media-radius)` | media |
| sections/gallery.liquid | `.section-gallery__lightbox-img` | `0.25rem` | `var(--media-radius)` | media |
| sections/hero.liquid | `.section-hero__countdown-item` | `0.5rem` | `var(--text-boxes-radius)` | text-box |
| sections/icon-boxes.liquid | `.section-icon-boxes__item` | `0.75rem` | `var(--card-corner-radius)` | card |
| sections/icon-boxes.liquid | `.section-icon-boxes__icon-wrap--square` | `0.5rem` | `var(--media-radius)` | media |
| sections/image-with-text.liquid | `/* ── Media ── */ .section-iwt__media` | `0.5rem` | `var(--media-radius)` | media |
| sections/layered-images.liquid | `.section-layered__layer` | `0.75rem` | `var(--media-radius)` | media |
| sections/slideshow.liquid | `.section-slideshow__content-inner` | `0.75rem` | `var(--text-boxes-radius)` | text-box |
| sections/slideshow.liquid | `@media (max-width: 749px) { .section-slideshow__content-inner` | `0.625rem` | deleted (inherits var(--text-boxes-radius)) | text-box |
| sections/slideshow.liquid | `tion-slideshow__pagination .swiper-pagination-bullet::before, .section-slideshow__progress` | `2px` | `2px (keep)` | keep |
| sections/testimonials.liquid | `/* ── Card (inline — also used by snippet) ── */ .testimonial-card` | `0.75rem` | `var(--card-corner-radius)` | card |
| sections/timeline.liquid | `.section-timeline__image` | `0.5rem` | `var(--media-radius)` | media |
| sections/video.liquid | `.section-video__wrapper` | `0.5rem` | `var(--media-radius)` | media |

## 2. Post-Edit Inventory (Remaining Hits)

Scan scope: `assets/*.css` and `sections|snippets|blocks|layout/*.liquid` for `border-radius:` values that are literal lengths other than 0/50%/999px/9999px/100%/inherit, or that use `var(--radius-(sm|md|lg|xl|control|control-lg))`.

Total remaining hits: **4** (all 4 are explicit KEEP items defined by contract):

1. `assets/base.css:239` | `0.25rem` | `.swatch--square`
   - **Justification**: Explicit KEEP in contract (`swatch shape modifiers (assets/base.css .swatch--square)`). Preserves swatch square shape modifier relative to 50% circle swatches.
2. `assets/float-social.css:104` | `4px` | `.float-social__list::-webkit-scrollbar-thumb`
   - **Justification**: Explicit KEEP in contract (`scrollbar thumbs (float-social.css ::-webkit-scrollbar-thumb)`). Preserves custom browser scrollbar track thumb shape.
3. `assets/theme.css:251` | `0.25rem` | `.swiper-custom-forSlider.swiper-horizontal .swiper-pagination .swiper-pagination-bullet`
   - **Justification**: Explicit KEEP in contract (`swiper pagination bullets (assets/theme.css ~251)`). Preserves pill/bullet geometry for swiper slider pagination bars.
4. `sections/slideshow.liquid:671` | `2px` | `.section-slideshow__progress`
   - **Justification**: Explicit KEEP in contract (`2 px indicator/progress bars (sections/slideshow.liquid pagination ::before / progress)`). Preserves thin 2px bar shape for slideshow progress indicator.

## 3. Remaining `--radius-*` Scale Consumers

Scan scope: Any consumer of `--radius-sm|md|lg|xl|control|control-lg` across `assets`, `sections`, `snippets`, `blocks`, `layout` (any CSS property, not only `border-radius`).

- `--radius-sm`: **0 consumers** remaining.
- `--radius-md`: **0 consumers** remaining.
- `--radius-lg`: **2 consumers** remaining:
  - `assets/theme.css:192`: `table tbody tr:last-child td:first-child { border-bottom-left-radius: var(--radius-lg); }`
  - `assets/theme.css:193`: `table tbody tr:last-child td:last-child { border-bottom-right-radius: var(--radius-lg); }`
  *(Note: Non-goal boundary — these are `border-bottom-left-radius` and `border-bottom-right-radius` declarations not included in the single-property `border-radius:` inventory scope).*
- `--radius-xl`: **0 consumers** remaining.
- `--radius-control`: **0 consumers** remaining.
- `--radius-control-lg`: **0 consumers** remaining.

---

Status: DONE
Summary: All 129 border-radius inventory rules across 35 files have been migrated to merchant-controlled tokens or preserved as explicit KEEP items, eliminating all literal lengths and old scale variables from border-radius rules.
Concerns/Blockers: None.