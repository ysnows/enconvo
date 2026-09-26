# Public-page sharing previews

Date: 2026-09-27

## Coverage

| Public URL | Share image |
| --- | --- |
| / | /og/enconvo-mac-agent-v1.jpg (existing) |
| /use-cases | /og/enconvo-use-cases-v1.jpg |
| /cloud-pricing | /og/enconvo-cloud-pricing-v1.jpg |
| /changelog | /og/enconvo-changelog-v1.jpg |
| /privacy | Existing brand image |
| /terms | Existing brand image |

All six sitemap pages have their own title, description, canonical share URL, image alt text, Open Graph metadata, and X/Twitter large-image cards. Metadata is rendered in the initial HTML and updated by Next Head on navigation.

Legacy /downloads keeps its existing /privacy canonical. /pricing redirects to /#pricing and shares the home card; /cloud-plan redirects to /cloud-pricing. URL fragments such as a walkthrough slug or pricing section use the containing page's card.

Only the explicit public allowlist receives cards. Auth, account, payment, placeholder and API pages do not inherit marketing metadata. Existing noindex handling remains in place.

## Assets and generation

Mode: built-in imagegen, three new sibling images with the existing home OG image and exact logo as visual references. Originals were preserved. Final JPEGs were resized/encoded with Sharp to 1200 × 630, sRGB, progressive, quality 88.

| Asset | Bytes |
| --- | ---: |
| enconvo-use-cases-v1.jpg | 114742 |
| enconvo-cloud-pricing-v1.jpg | 92735 |
| enconvo-changelog-v1.jpg | 82845 |

Visually inspected each final JPEG at delivery size. Illustrative UI panels are concepts rather than literal product screenshots. Pricing artwork has no fixed monetary amounts, and release artwork has no version numbers or dates.

Reference inputs: public/og/enconvo-mac-agent-v1.jpg and public/logo.webp.

### Full generation prompts

#### use-cases

Create a premium standalone Enconvo website Open Graph sharing card, landscape 1200 by 630 composition (1.905:1). Image 1 is a visual style reference, NOT an edit target: retain its professional Enconvo identity, understated blue/cyan refracted ribbons at the edges, dark near-black Crystal canvas, white folded-ribbon logo and system-native typography. Image 2 is the exact brand logo reference; reproduce faithfully. Build a NEW sibling graphic for the specified page. Keep important text well within 70px safe margins. Large readable white heading, smaller pale-gray subline, compact Enconvo icon and wordmark near top. Crisp restrained native macOS glass, thin translucent strokes, no heavy shadows, no extra decorative badges. Final standalone graphic only, no browser frame, watermark or social UI. No invented prices, rates, statistics, dates, model names or version numbers.
Page: use cases. Exact main text: "See what your Mac can do." Exact subline: "Real tasks. Step-by-step walkthroughs." Illustrate three beautifully composed dark macOS-inspired panels across the lower half: a spreadsheet with an understated line chart, an editorial personal website with abstract content (no people), and a short node workflow. Each has a small discreet play symbol to communicate video walkthroughs. Show one Enconvo sidebar adjoining the spreadsheet panel. Keep UI text minimal, crisp large labels only "Write", "Research", "Automate". These are illustrative concepts, not literal screenshots. Elegant editorial product composition.

#### cloud-pricing

Create a premium standalone Enconvo website Open Graph sharing card, landscape 1200 by 630 composition (1.905:1). Image 1 is a visual style reference, NOT an edit target: retain its professional Enconvo identity, understated blue/cyan refracted ribbons at the edges, dark near-black Crystal canvas, white folded-ribbon logo and system-native typography. Image 2 is the exact brand logo reference; reproduce faithfully. Build a NEW sibling graphic for the specified page. Keep important text well within 70px safe margins. Large readable white heading, smaller pale-gray subline, compact Enconvo icon and wordmark near top. Crisp restrained native macOS glass, thin translucent strokes, no heavy shadows, no extra decorative badges. Final standalone graphic only, no browser frame, watermark or social UI. No invented prices, rates, statistics, dates, model names or version numbers.
Page: Enconvo Cloud model and service rates. Exact main text: "One balance. Every kind of AI." Exact subline: "Explore Enconvo Cloud model and service rates." Lower half: one elegant wide native dark glass panel, containing a clear grid or list of five service categories with delicate simple monochrome icons: "Chat", "Images", "Video", "Speech", "Search". A subtle point-balance token symbol near the panel edge may help, but absolutely no numeric balance, prices, discounts, tier names, charts implying growth, or credit-card/payment marks. Informational, calm, precise. No claims about unlimited use.

#### changelog

Create a premium standalone Enconvo website Open Graph sharing card, landscape 1200 by 630 composition (1.905:1). Image 1 is a visual style reference, NOT an edit target: retain its professional Enconvo identity, understated blue/cyan refracted ribbons at the edges, dark near-black Crystal canvas, white folded-ribbon logo and system-native typography. Image 2 is the exact brand logo reference; reproduce faithfully. Build a NEW sibling graphic for the specified page. Keep important text well within 70px safe margins. Large readable white heading, smaller pale-gray subline, compact Enconvo icon and wordmark near top. Crisp restrained native macOS glass, thin translucent strokes, no heavy shadows, no extra decorative badges. Final standalone graphic only, no browser frame, watermark or social UI. No invented prices, rates, statistics, dates, model names or version numbers.
Page: changelog. Exact main text: "A better Mac assistant." Exact subline: "Explore the latest Enconvo releases." Lower half: a beautiful native dark translucent release-note window with an editorial timeline at the left; three crisp headings "New features", "Improvements", "Fixes", simple fine-line glyphs and subdued abstract text lines. One small green success dot used as status only. Layer restrained crystal refraction behind the panel and echo the upper brand ribbons. No version numbers or dates or invented specific features, so it stays accurate as releases change.

## Impact and verification

Shared surface: src/pages/_app.tsx renders SocialMetadata for every route. The new public metadata registry owns share tags; duplicate page-owned tags were removed from home, use cases, and changelog. Normal page titles, descriptions, canonical URLs, structured data, authentication, payment, and routing behavior retain their existing owners.

Fresh verification passed:

- `npx tsc --noEmit --incremental false` in the working checkout.
- `npm run build` in `/tmp/enconvo-skillry-verification-coXJdW`, using the repository's existing frozen pnpm lockfile dependency tree; lint, types, compilation and generation of all 27 static pages passed. Log: `/tmp/enconvo-social-pages-build.log`. Existing unrelated warnings remain for hooks, older browser data, optional Sharp and large changelog page data. The working checkout's previously diagnosed npm parser/TypeScript mismatch was not changed.
- `node scripts/check-social-preview.mjs http://localhost:3116/`: both Twitterbot and Facebook user agents validated six public pages, three legacy routes, and 12 private/placeholder routes. Checks cover unique tags, page-specific titles/images, canonical URLs, descriptions, alt text, noindex boundaries, unauthenticated image responses, MIME type, dimensions, sRGB and the 300 KB size budget.
- `SITE_CHECK_URL=http://localhost:3116 node scripts/check-homepage-discovery.mjs`: existing sitemap, canonical, structured data and crawler access passed.
- `NAV_CHECK_SITE=http://localhost:3116 node scripts/check-homepage-navigation.mjs`: shared navigation passed.
- `SITE_CHECK_URL=http://localhost:3116 node scripts/check-use-case-discovery.mjs`: gallery filtering, SSR, structured data and deep links passed.
- Browser keyboard navigation: home → use cases → privacy → back to use cases → login → home. Each public page settled on exactly its own share URL/image; login had zero Open Graph/Twitter tags and retained `noindex, follow`; home restored its original share image. No browser console errors were observed.

Residual impact: this change shares metadata handling across pages, so the regression script checks public coverage and prevents marketing tags from leaking into private routes. Authentication and payment endpoints were not modified; only their crawler-visible page metadata was checked, with no sign-in or payment performed.

Deployment is outside this task. Social platforms may cache earlier previews and must fetch the deployed assets before these cards can appear publicly. No modules changed; module builds are not applicable.
