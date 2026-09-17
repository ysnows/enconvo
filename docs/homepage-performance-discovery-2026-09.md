# Homepage performance and discovery — 2026-09-17

The showcase sound control is always visible, including during playback with
the pointer outside the player. Sound remains the visitor's choice across clips.

## Measured performance

Compared the existing main commit `54fda51` and the optimized source in isolated
production builds with the frozen pnpm lockfile. Both builds passed. Lighthouse
13.4.1 used Edge headless with its default mobile simulated throttling and fresh
browser storage. These are local lab samples, not field Core Web Vitals.

| Metric | Before | Final optimized run |
| --- | ---: | ---: |
| Performance | 61 | 87 |
| First Contentful Paint | 5.5 s | 1.1 s |
| Largest Contentful Paint | 8.0 s | 3.8 s |
| Total Blocking Time | 100 ms | 140 ms |
| Cumulative Layout Shift | 0 | 0 |
| Speed Index | 5.7 s | 3.0 s |
| Transfer size | 4,493 KiB | 4,119 KiB |
| Accessibility | 97 | 100 |
| SEO audit | 100 | 100 |

The first optimized run also scored 87, with LCP 2.9 s and TBT 360 ms.
CPU, network and video transfers vary between samples; not every metric improved.
Machine-readable measurements are in `measurements/homepage-2026-09-17.json`.
Full Lighthouse reports were retained in `/tmp/enconvo-home-{before,after,final}.report.html`.

## Changes and impact

- Use a 48 KB poster extracted from the actual demo, reserve the video geometry,
  and request playback only while the player is visible. Pause it when offscreen
  or when the document is hidden, preserving manual pause and sound settings.
- Respect reduced motion and data saving when deciding whether to autoplay.
  Keep explicit Play available. Only the timeline rerenders on progress updates.
- Replace the embedded PNG logo (176 KB transferred) with the same artwork as a
  3.5 KB WebP with explicit dimensions. Shared navigation and authentication use it.
- Remove the unused external Inter font and global Stripe script. The existing
  system font stack remains; non-Mac visitors use their OS font. The payment page
  retains its own `loadStripe`; checkout redirects and purchase handlers are unchanged.
  Analytics and affiliate script timing are unchanged.
- Improve the contrast of footer links and small homepage text, and include
  EnConvo in the shared home link's accessible name.
- Provide server-rendered product facts, FAQ answers, and Organization, WebSite,
  WebPage and SoftwareApplication JSON-LD. Do not invent review/rating signals.
- Align public page canonical URLs and sitemap URLs on `https://www.enconvo.com`.
  Include use cases and Cloud rates; identify the legacy `/downloads` privacy-page
  duplicate with the `/privacy` canonical. Legal text is unchanged.
- Add robots.txt, a factual llms.txt navigation aid, and noindex metadata for
  account/auth/payment utility pages. Public marketing pages stay indexable.

## Verification

- Final production build passed type checking, lint and page generation. Existing
  unrelated hook dependency warnings and stale Browserslist-data notice remain.
- `node scripts/check-visible-video.mjs`: visible/hidden playback, manual pause,
  sound preservation, reduced motion, save-data, late playback promise, cleanup,
  and placeholder activity passed.
- `node scripts/check-homepage-discovery.mjs`: all six sitemap pages, canonical
  uniqueness, server-rendered facts, valid JSON-LD, robots.txt, llms.txt, and utility
  page noindex passed. Googlebot, OAI-SearchBot and PerplexityBot user-agent requests
  received the public content; this does not prove access from real crawler IPs.
- Navigation regression passed for home, use cases and releases, including the
  signed-in/out link definitions. Browser Use Cases → Pricing returned to `/#pricing`.
- Existing social preview regression passed for Twitterbot and Facebook: public
  1200 × 630 JPEG, 97,599 bytes, matching large-image-card metadata.
- First-paint fixture passed at 1280 px and 390 px: title, video and backdrop
  geometry had zero change between critical CSS and the complete stylesheet.
- Browser checks passed: sound always visible outside hover; enabling/muting stays
  selected across clips; offscreen pause/resume; manual pause stays paused; seeking;
  mobile layout without horizontal overflow; monthly/annual prices and team seats;
  32 px navigation logo and 64 px login logo; login → home clears noindex correctly.
- No real payment was submitted. No modules or native app code changed.

## Remaining considerations

The visible demo still downloads video and uses rendering resources; its quality
and animated background are deliberately retained. Monitor production field data
before treating local improvements as a Core Web Vitals pass.

The existing price cards advertise 30-day refunds while the FAQ says 14 days.
The owner was asked to confirm the policy; neither claim was changed without an
answer. No refund claim was added to structured data.

Indexing, AI citations and rankings depend on external systems. There is no
special AI schema or llms.txt requirement for Google AI features. The application
graph is factual semantic metadata; without authentic review signals we do not
claim eligibility for Google's software-app rich result.

## Primary guidance

- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [Google: Software app structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app)
- [OpenAI: crawler controls](https://developers.openai.com/api/docs/bots)
