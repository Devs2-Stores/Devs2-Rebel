# Sartor 1.0.0 - release notes

Initial release of Sartor, a Shopify Online Store 2.0 theme with two style presets (Sartor and Yarrow).

## Included

- JSON templates for every storefront page, section groups for header and footer, and `@app` support in the main product, featured product and collection sections.
- Product media of every type (image, video, external video, 3D model) in the product page, featured product and quick view.
- Search and collection filtering through Shopify Storefront Filtering, with active filter chips and sort.
- Cart page and drawer with line-level discounts, unit prices, selling plans, taxes and shipping policy notes, order notes and accelerated checkout buttons.
- Customer account pages that show per-line discounts, original prices and selling plan names.
- Custom Liquid block on product sections and a pickup availability block.
- Structured data (Product, Article, Organization, WebSite, BreadcrumbList) and Open Graph / Twitter metadata.
- English locale files (`en.default.json`, `en.default.schema.json`) covering every customer-facing string.

## Submission notes

- `release-notes.md` is for the Theme Store form. Do not add it to the zip until the theme is published; Shopify requires it only for updates.
- The zip is built by `python scripts/package-theme.py` and contains `listings/sartor` and `listings/yarrow`, one folder per preset. `listings/manifest.json` is excluded by `.shopifyignore`.
