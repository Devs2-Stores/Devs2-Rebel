# fix-VisualE: hero-class video, featured product preset, home length

All live results are provisional (shared dev server `127.0.0.1:9292`). Probes live in `scratch/VisualE/` (`baseline.cjs`, `embed.cjs`, `hosted.cjs`, `home.cjs`).

## 04 #7 Video as a story medium: done (with one live-path caveat)

Files changed
- New `snippets/video-media.liquid`: a hosted `video` or an external `video_url` (YouTube/Vimeo) filling its positioned parent. Hosted: `<video autoplay loop muted playsinline preload="metadata" poster aria-label>`; sources carry `src` when `eager`, otherwise `data-src` until the section is near the viewport. External: `<div data-media-video="embed">`, the iframe is created by script (`title` = label, `allow="autoplay; encrypted-media"`, mute/loop/no-controls URL params, YouTube via `youtube-nocookie`).
- New `snippets/video-control.liquid`: pause/play `<button>` (hidden until script runs, `aria-label` swaps `accessibility.pause_video` / `accessibility.play_video`) plus the playback script. It loads on first intersection (`rootMargin 200px`), pauses when offscreen, resumes when visible, honours a user pause until the user presses play, sets the toggle to "Play" if the browser rejects autoplay (`NotAllowedError`), and reacts to a `media-video:hold` event. YouTube/Vimeo are paused/played through `postMessage`.
- `sections/hero.liquid`, `sections/slideshow.liquid`, `sections/image-with-text.liquid`: new `video` and `video_url` settings (slide block for the slideshow). The video wrapper sits over the existing image, so the image remains the poster, the LCP element and the layout box. Hero keeps `fetchpriority="high"` on the image; the video is `eager` only when the image is `high` priority (`section.index <= 2`), otherwise lazy. Slideshow: slide 1 eager, other slides start `data-hold` (not loaded, not playing); `syncHiddenSlides` dispatches `media-video:hold` so only the active slide's video plays.
- `assets/section-video.css`: shared `.media-video*` styles (cover fit, 16:9 cover for iframes through container-query units, 40 px toggle with `:focus-visible`, hover inside `@media (hover: hover)`). Per-section tweaks: `section-hero.css` (focal-point `object-position`), `section-image-with-text.css` (`.section-iwt__media` is `position: relative`), `section-slideshow.css` (toggle moves up when the counter is shown).
- Locales: `accessibility.pause_video`, `accessibility.background_video` in `en.default.json`; `video`/`video_url` label + info for hero, slideshow slide and image-with-text in `en.default.schema.json` (hero `image_alt` info now says it also names the video).
- Accessible name of the video: hero `image_alt`, slide heading, IWT image alt, falling back to `accessibility.background_video`. Never autoplay with sound: `muted` is always rendered, embeds use `mute=1` / `muted=1`.
- Nothing is rendered or loaded (no CSS, no script) when neither setting is set.

Measured (provisional)
- Video unset vs. original code: I rendered `git HEAD` copies of the three sections side by side with the new ones on a throwaway collection template. At 1440 and 375 the bounding boxes of `.section-hero`, `__media`, `__content`, `.section-slideshow`, `__slide`, `.section-iwt`, `__media`, `__content` are identical and the normalised section HTML is byte-identical. The throwaway sections/templates are deleted.
- External video, live Shopify render (`youtube.com/watch?v=0jeoo7Ol3aI` on hero, 2 slides and IWT) at 1440 and 375: hero iframe created at once (`eager`), title `Background video`, filling the 1440x540 / 375x487 box (iframe 1440x810 / 866x487 = cover); slide 1 iframe created, slide 2 `data-hold` with no iframe until activated; IWT iframe appears when scrolled to, 621x349 / 345x194; toggle 40x40, `Pause video` -> `Play video` (`is-paused`) -> `Pause video`; 0 page errors.
- Hosted video: the dev store has no hosted video. I uploaded a 4 s clip through the Admin API (staged upload), but `shopify theme dev` refused `shopify://files/videos/visuale-test-clip.mp4` in a template ("does not point to an applicable shopify-hosted video resource") even after the file was READY, and that put the dev server into a 500 for about a minute until I deleted the template (sorry, CollectionD). I deleted the uploaded file afterwards. So the hosted path was verified like this instead: the real `snippets/video-media.liquid` rendered with liquidjs against a fake `video` object (local webm sources + poster), injected into the live page HTML, with the real theme CSS and the real `video-control` script, at 1440 and 375. Results: `muted true, loop true, playsInline true, autoplay true, preload metadata`, `poster` set, `aria-label` set, source `src` set on eager (hero, slide 1), lazy `data-src` -> `src` on the IWT when scrolled in and on slide 2 when it becomes active; toggle click -> `video.paused` true + label `Play video`; second click -> `paused` false + `Pause video`; scrolled offscreen -> paused, back -> playing; slideshow: active slide plays, inactive slide paused, switching with `next` swaps them. This is static-render proof, not a Shopify-hosted file; the controller should do one real hosted-video check in the editor.
- Console: no page errors from these sections. The dev server pages log environment noise (origin_trials CORS, `shop.app` framing CSP, 403/400 storefront API, `[shopify-account] Menu ...`), identical with and without my change.

## 04 #8 Featured product placeholder: done

- `templates/index.json`: `featured_piece.product` is now `rebel-tactical-bomber-jacket` (the handle the five `listings/*/templates/index.json` already used; it exists and is active on the dev store).
- Home live, provisional: `.section-featured-product` is 971 px (1440) and 1162 px (375), title "Rebel Tactical Bomber Jacket"; the earlier `h0` is gone.
- `sections/featured-product.liquid` unchanged: with a blank product it already renders its media placeholder, the example title and the `sections.featured_product.empty` hint under `request.design_mode`, and nothing outside the editor. That is the `DESIGN.md` rule ("a blank product renders only its editor placeholder under `request.design_mode`"), so I kept it. `assets/section-featured-product.css`: the hint is now a dashed bordered note so the design-mode card reads as a placeholder.
- Known gap: an installed store without that handle still renders nothing outside the editor (`DESIGN.md` rule). The design-mode card could not be exercised on the dev server (no editor session); it is static CSS/markup that existed before.

## 04 #13 Home length: reported only, nothing deleted

Measured section heights, home, provisional:

| Section | 1440 | 375 |
|---|---|---|
| hero_slideshow | 765 | 650 |
| scrolling_tagline | 100 | 78 |
| collection_list | 673 | 652 |
| featured_piece | 971 | 1162 |
| marquee_products | 702 | 514 |
| lookbook_hotspots | 1047 | 381 |
| before_after_craft | 1006 | 448 |
| brand_story | 626 | 707 |
| layered_atelier | 780 | 1058 |
| image_text_overlay_hero | 810 | 731 |
| parallax_atelier | 720 | 650 |
| testimonials | 462 | 438 |
| blog_journal | 719 | 1532 |
| press_logos | 209 | 164 |
| newsletter | 343 | 343 |
| Total (page) | 10490 | 10017 |

Proposed trim to 10 sections (controller decision; edit `templates/index.json` and the five `listings/*/templates/index.json` order): keep hero_slideshow, scrolling_tagline, collection_list, featured_piece, marquee_products, lookbook_hotspots, brand_story, testimonials, blog_journal, newsletter. Move before_after_craft, layered_atelier, image_text_overlay_hero, parallax_atelier and press_logos to secondary templates (About / a lookbook page). Saves about 3525 px at 1440 and 3051 px at 375, leaving about 6965 / 6966 px. Separately, blog_journal at 375 (1532 px) and featured_piece at 375 (1162 px) are the tallest mobile sections.

## Validators
`validate-locales.mjs` SUCCESS, `validate-schema-ranges.mjs` SUCCESS, `settings-usage.cjs` exit 0 (985 settings, 0 unread), JSON parses. No JS files changed (the playback script is inline in the snippet).

## Durable rules
- Video in a story section is a `video-media` + `video-control` pair over the existing image: the image stays the poster, LCP element and layout box, the video is always muted and looping with a pause button, and it loads and plays only while visible.
- A section that can hold several videos (slideshow) holds inactive slides' videos with `media-video:hold`, so only the visible slide loads and plays.
- A demo preset must pick a product handle that exists in the demo store; a blank product still renders only its editor placeholder under `request.design_mode`.
