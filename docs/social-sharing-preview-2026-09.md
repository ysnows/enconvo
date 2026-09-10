# Homepage social sharing preview

## Problem and direction

The user reported that sharing `https://www.enconvo.com/` on X showed an empty
thumbnail and long text. The homepage declared `summary_large_image`, but had
neither `og:image` nor `twitter:image`. Their Raycast reference calls for a
large, polished brand image with a clear product benefit.

Use Enconvo's existing folded-ribbon logo, dark Crystal surfaces and blue light
ribbons. Keep the established headline: “The assistant your Mac was promised.”
The secondary line is “Understands your screen. Works in your apps.” A simplified
product illustration shows an Enconvo sidebar attached to Finder, organizing
files into folders. This communicates action inside Mac apps. It is an editorial
product depiction generated from a public demo frame, not a literal screenshot.

## Asset and generation

- Final asset: `public/og/enconvo-mac-agent-v1.jpg`.
- Dimensions: 1200 × 630; progressive sRGB JPEG; 97,599 bytes.
- Generation mode: built-in image generation tool, followed only by resizing
  and JPEG encoding for delivery. No new runtime dependency.
- Original: `/Users/ysnows/.codex/generated_images/01a08afa-264a-7df1-b338-4dc1a62225f1/exec-9c719bfb-1d75-4e38-a87e-cc1f7d499018.png`.
- References: the current `public/logo.svg` embedded mark; the 18-second frame
  from `distribution/videos/app-sidebar-launch.mp4`; the user's Raycast social
  preview as a composition reference only.

### Final production prompt

Create a premium standalone landscape social sharing graphic for Enconvo at
1200 × 630. Preserve the supplied folded-white-ribbon app icon. Use a near-black
charcoal canvas with luminous cyan/icy-blue curved ribbons and a restrained
lavender edge, clean negative space, crisp SF/Inter-like typography and native
Mac craftsmanship. Center the compact logo and “Enconvo” wordmark above the
two-line headline “The assistant your” / “Mac was promised.” Add the line
“Understands your screen. Works in your apps.”

In the lower half, show a large front-facing dark Finder Downloads window with
an Enconvo sidebar attached directly on its right, based on the real public demo.
Use thin translucent strokes, modest corners and subtle shadows. Show Documents,
Images and Archives folders. The Enconvo panel reads “Organize this folder.”
followed by checked actions “Read folder contents”, “Create folders” and
“Move files”. Keep the top text inside social-card safe margins; let the product
composition extend below the bottom crop. No social composer/browser frame,
Raycast branding, personal data, prices, model names, watermark or unrelated
decorative icons. This is a spare editorial depiction of the actual product.

## Integration and impact

Only the homepage metadata changes. The visible page title, page copy, layout,
pricing and interaction code stay as previously released. Add a concise social
title/description, canonical URL matching the site's actual `www` redirect,
Open Graph site name/locale, image URL/type/dimensions/alt, and Twitter image/alt.
All tags are rendered into the initial HTML, so crawlers do not need JavaScript.
Serve a versioned JPEG directly from `public/og`, without image optimization,
authentication, remote image fetching or a dynamic rendering endpoint.

The metadata follows the [Open Graph specification](https://ogp.me/). The
`summary_large_image` card declaration is retained. Other pages and their
metadata are unaffected; homepage hash links such as `#pricing` share the same
homepage preview. Social platforms control their own existing link-preview
caches; successful crawler fetches do not prove that a previously cached X
composer preview has already refreshed. No social post is sent by this task.

## Verification

`node scripts/check-social-preview.mjs <site-url>` checks the actual initial
HTML and JPEG response using Twitterbot and Facebook crawler user agents:

- Required social tags appear exactly once in the server-rendered head.
- Canonical URL, image URL, format and large-image card type are correct.
- Twitter/Open Graph titles, descriptions and alt text agree.
- The image loads anonymously as JPEG and matches the declared dimensions.
- The image remains below the 300 KB delivery budget.

Both crawler checks passed against development and a local production server.
Standard `npm run build` passed with lint and TypeScript enabled and generated
all 28 static pages, using the existing frozen pnpm dependency tree. Existing
non-fatal hook/image, browser database and changelog-size warnings remain.
Build log: `/tmp/enconvo-social-release-build.log`.

The final image was visually inspected at delivery size for clear branding,
copy and product composition. Post-deployment acceptance is tracked in the
active root Beta 32 changelog. No modules or payment/authentication flows are
changed; module builds and real payment tests do not apply.
