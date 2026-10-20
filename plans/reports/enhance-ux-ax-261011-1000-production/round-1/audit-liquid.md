### Scope gift card recipient input IDs with section and block identifiers [blocks/buy_buttons.liquid:18] p1
Static HTML element IDs in blocks/buy_buttons.liquid (such as id="gift-card-recipient-toggle", id="gift-card-recipient-email", and button IDs id="product-template__add") produce duplicate DOM identifiers whenever multiple product instances render on the same page (e.g., featured product on index and quick view modal). Clicking <label for="gift-card-recipient-toggle"> targets the first matching input in the document, failing to activate recipient fields in subsequent instances. Append -{{ section.id }}-{{ block.id }} to the element IDs and matching label for attributes.

### Separate page-width container class from component wrapper classes [sections/banner-hotspots.liquid:17] p1
In sections/banner-hotspots.liquid:18, page-width is combined on the same element as section-hotspot__head inside an outer page-width wrapper, violating the workspace container invariant requiring page-width to stand alone without sibling classes or styling wrappers. Move page-width to an isolated parent element or remove redundant nested page-width declarations.

### Isolate page-width container from color scheme styling classes [sections/main-cart.liquid:17] p1
In sections/main-cart.liquid:18, page-width is merged on the same element with color-{{ section.settings.color_scheme }}, violating the strict container invariant where page-width must remain uncoupled from layout, theme color, or presentation classes. Wrap inner cart elements in a dedicated color scheme div inside the standalone page-width element.

### Remove page-width class from marquee header and placeholder wrappers [sections/marquee-products.liquid:25] p1
In sections/marquee-products.liquid:26 and line 57, page-width is attached directly to .section-marquee-products__head and .section-marquee-products__placeholder-list. Combining width constraints with flex/grid containers violates the workspace container rule. Nest .section-marquee-products__head inside a dedicated .page-width container.

### Isolate page-width container from video section header and description [sections/video.liquid:43] p1
In sections/video.liquid:44 and line 122, page-width is combined with section-video__head and section-video__desc. The theme invariant dictates that page-width must occupy its own DOM node without component modifier classes. Split the markup so page-width wraps the component elements cleanly.

### Localize empty blog state fallback message using translation filter [sections/blog-posts.liquid:76] p2
In sections/blog-posts.liquid:78, the empty state message renders hardcoded English text 'Select a blog to display posts' directly within markup when no blog is selected. In non-English storefronts, this untranslated copy is exposed to merchants and shoppers. Replace the literal with a locale string via {{ 'sections.blog_posts.empty' | t }}.

### Localize empty product state fallback copy using translation filter [sections/featured-product.liquid:92] p2
In sections/featured-product.liquid:94, the fallback container renders literal English text 'Select a product to display' when no product is configured. This unlocalized string leaks English copy on localized storefronts. Replace the literal with {{ 'sections.featured_product.empty' | t }}.

### Localize empty video source message using translation filter [sections/video.liquid:112] p2
In sections/video.liquid:114, the fallback block outputs literal English text 'Select a video source' when neither video URL nor Shopify hosted video is selected. Replace the hardcoded string with {{ 'sections.video.empty' | t }} to support multi-language storefront localization.

### Replace handwritten img tag with Shopify native image_tag filter [sections/main-customers-order.liquid:115] p2
In sections/main-customers-order.liquid:117, customer order line items render line_item.image via an unoptimized handwritten <img> tag with a single fixed image_url width, omitting responsive srcset and width descriptors. Replace with {{ line_item.image | image_url: width: 160 | image_tag: widths: '80, 160', loading: 'lazy', decoding: 'async' }}.

### Migrate sticky add-to-cart image from handwritten img to image_tag [snippets/product-sticky-add.liquid:8] p2
In snippets/product-sticky-add.liquid:9-12, the product featured image is rendered with a raw <img> element and manual srcset string rather than the platform standard image_tag filter. Migrate to {{ product.featured_image | image_url: width: 160 | image_tag: widths: '120, 160, 240', sizes: '60px', alt: product.title, loading: 'lazy', decoding: 'async' }}.

### Add fetchpriority high to custom mobile hero banner image [sections/hero.liquid:42] p2
In sections/hero.liquid:42-50, when custom_mobile_url is configured, the mobile hero <img> element sets loading="eager" but omits fetchpriority="high". As the primary LCP element on mobile viewports, omitting fetchpriority degrades mobile Core Web Vitals discovery timing. Add fetchpriority="high" on LCP hero instances.

### Add explicit type="button" to slider navigation controls [sections/featured-collection.liquid:78] p2
In sections/featured-collection.liquid:79 and 82, the previous and next slide buttons omit an explicit type attribute, causing the browser to default their type to submit. Interactive controls outside or inside form boundaries should explicitly state type="button" to satisfy HTML and WCAG interaction standards.

### Add explicit type="button" to slideshow slider navigation controls [sections/slideshow.liquid:174] p2
In sections/slideshow.liquid:175 and 178, the prev and next navigation controls are declared as <button> without an explicit type="button" attribute, defaulting to submit buttons under HTML semantics. Add type="button" to prevent unexpected behavior.

### Remove or preset-enable dead monolithic page-about section [sections/page-about.liquid:195] p2
sections/page-about.liquid (494 lines) is completely unreferenced by templates/page.about.json and listings/*/templates/page.about.json, which compose the page from modular sections. Because page-about.liquid also defines no presets in its schema, merchants cannot add it in the Theme Editor, making this file 100% dead code.

### Exclude .antifan, specs, docs, and .env from shopify theme synchronization [.shopifyignore:1] p1
.shopifyignore does not exclude .antifan/, specs/, docs/, .env, or .workspace-context.json. When developers run shopify theme push or shopify theme dev, non-theme folders and sensitive configuration files (.env containing Storefront and Admin tokens) risk synchronizing to remote Shopify servers. Add these patterns to .shopifyignore.

### Escape Organization sameAs social URLs and include Twitter and Pinterest [snippets/head-meta-tags.liquid:114] p2
In snippets/head-meta-tags.liquid:116-121, social media URLs are concatenated into JSON strings using raw string concatenation without the | json filter, creating syntax breakage if URLs contain unescaped characters. Furthermore, settings.social_twitter_link and settings.social_pinterest_link configured in settings_schema.json are omitted from the array.

### Remove orphaned reCAPTCHA schema translation keys [locales/en.default.schema.json:526] p3
In locales/en.default.schema.json:526-534, keys header__recaptcha and recaptcha_site_key remain in the schema locale file after reCAPTCHA was removed from config/settings_schema.json due to Shopify Theme Store bans on third-party captcha injection. Clean up these orphaned keys to avoid locale bloat.

### Replace static inline max-width CSS style with CSS custom property [sections/image-text-overlay.liquid:38] p3
In sections/image-text-overlay.liquid:41, the text box applies style="max-width: {{ section.settings.content_width }}rem;", violating the theme design system constraint banning static inline CSS properties in favor of CSS custom properties. Replace with style="--content-max-width: {{ section.settings.content_width }}rem;" and apply via class rule.
