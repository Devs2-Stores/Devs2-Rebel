# Theme Architecture

## Overview

Rebel is a Shopify Online Store 2.0 base theme on the `main` Git branch. It is configured as a verified base theme in [.workspace-context.json](../.workspace-context.json). The deployable surface is the standard Shopify theme directories; `_reference/`, `node_modules/`, plans, and documentation are excluded from upload by [.shopifyignore](../.shopifyignore).

## Request Path

`layout/theme.liquid` is the global shell. It renders metadata, fonts, styles, configuration, deferred scripts, header/footer section groups, and global overlays (newsletter, cart, search, quickview, social, toast, and back-to-top). `layout/password.liquid` is the separate password-page shell.

JSON templates under [`templates/`](../templates/) select ordered sections for storefront routes. Section files under [`sections/`](../sections/) own editor-configurable page blocks; reusable Liquid fragments live under [`snippets/`](../snippets/). The active template is the authority for which sections render on a route.

Quick view uses [`sections/product-quickview.liquid`](../sections/product-quickview.liquid) as its only product fragment, fetched from the current product route with `?section_id=product-quickview` (Section Rendering API). The global modal owns the fetched product payload and the quick-view picker consumes that payload; no search-context section owns this response.

## Asset Boundaries

- [`snippets/head-stylesheets.liquid`](../snippets/head-stylesheets.liquid) loads reset, design-system/theme CSS, then template-specific CSS.
- [`snippets/head-script.liquid`](../snippets/head-script.liquid) publishes `window.themeConfig` (Shopify routes, localized strings, cart events, and product data where applicable), then loads global and template-specific JavaScript.
- [`snippets/head-design-systems.liquid`](../snippets/head-design-systems.liquid) derives CSS custom properties from theme settings and color schemes.
- [`assets/`](../assets/) contains the CSS/JS implementations. Interactive behavior is primarily implemented as custom elements and Shopify section/cart endpoints rather than a framework runtime.

Keep CSS mobile-first and component-scoped. Reuse Shopify image filters (`image_url`/`image_tag`) for responsive dimensions. The detailed Liquid, CSS, accessibility, and performance rules are maintained in [`AGENTS.md`](../AGENTS.md).

## Commerce Contracts

The browser configuration exposes Shopify cart, search, checkout, and product routes. Cart, product variant selection, collection filtering, predictive search, quickview, customer forms, and modals are coordinated through `themeConfig`, custom elements, and `localStorage`/`sessionStorage` where the feature requires client persistence. When changing one of these flows, inspect its paired section/snippet, asset, and template before editing.

Product card quick-add forms (`snippets/product-card.liquid`) carry the add-to-cart URL on the submit button's `formaction`, not on the form's `action`. Shopify's storefront `shop_events_listener` binds and fires a "Viewed Product Variant" analytics event for every form whose `action` contains `/cart/add` on page load. On the 30-card `/collections/all` demo page, Lighthouse mobile measured a median of about 600 ms of throttled scripting in that listener before the change; after it, the listener fell below Lighthouse's bootup-time reporting threshold and was no longer listed. The listener also recorded a variant view for every listed product. `product-card.js` posts to `themeConfig.routes.cart_add_url`, and without JavaScript the button still submits to `/cart/add`. Do not move the URL back to `action`.

## Verification

Theme Check is configured by [`.theme-check.yml`](../.theme-check.yml). Run the repository-approved Shopify Theme Check command only with user approval, as required by the theme contract. Browser preview validation is required for changes crossing product, collection, cart, search, modal, customer, or editor settings contracts.

## Boundaries and Non-goals

This repository is a theme, not a Shopify app or backend. It does not own deployment credentials, store data, or generated reference artifacts. Do not infer platform patterns from Haravan or Sapo themes, and do not treat stateful plans/reports as current implementation authority.
