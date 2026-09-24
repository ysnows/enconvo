# SEO log — enconvo.com

Append-only. Newest entry at the bottom. One entry per pass or change.

## 2026-09-24 — Setup and first checkup

- Set up the SEO workspace: `BRIEF.md`, `STATE.md`, this log.
- Ran the four-pass homepage checkup; report in
  `reports/2026-09-24-homepage-checkup.md`.
- Shipped prerequisites (measurement and hygiene, not experiments):
  - GA4 events `download_click` (hero download menu) and `begin_checkout`
    (license and Cloud plan CTAs).
  - `/pricing` 307 → `/#pricing`; `/cloud-pricing` plan links now point to
    `/#pricing`.
  - noindex on `/developer`, `/mcp/install`, `/okara`.
  - `llms.txt` documentation link → `https://docs.enconvo.ai/`.
- Verified on a local production build: redirects, robots meta, discovery,
  navigation and social-preview checks pass; both events fire with the
  expected params in a browser.
- Recommended ONE change for approval: descriptive homepage section headings
  (see report). Not published.
- Blocked: no Search Console or GA4 read access, so the money page and the
  baseline cannot yet be set from real query or conversion data.

## 2026-09-24 — Owner approved all recommendations

Approved: the ONE heading change, plus the hygiene decisions and data setup.
Everything below is in the local working tree. Nothing is committed or
deployed yet.

- **ONE change: descriptive homepage headings.** The four slogan H2s became
  kickers, and each H2 now says what the section covers (table in the report).
  Also changed the FeatureGrid lead-in from "100+ capabilities ship built in. A
  few highlights:" to "A few highlights from what ships built in:", because
  the H2 now carries "100+".
- **Refund policy.** Kept the policy the backend enforces
  (`envonvo.api.workers/src/controller/refund.ts`: 30-day self-serve refunds
  for Standard, Premium and Teams licenses, none for Cloud subscriptions or
  top-ups). Rewrote the FAQ and the Terms refund paragraph to say this. The
  Terms "Pricing strategy" section is still outdated and needs the owner.
- **Spelling.** "EnConvo" → "Enconvo" in the site's own text (nav wordmark,
  footer, auth pages, use cases, changelog page chrome, feature data).
  Unchanged on purpose: customer quotes and historical release notes.
- **`/okara`.** Deleted the page, its data file, its SEO engine and both
  verification scripts. The URL now returns 404, and it is no longer in the
  noindex list.
- **`docs.enconvo.com`.** Wrote a redirect map in `enconvo_docs/vercel.json`.
  Mapped old pages go to their `docs.enconvo.ai` equivalents and everything
  else goes to the docs home. Every target returned 200. Rule matching was
  tested with path-to-regexp 6.1.0. Not deployed; that needs a push to
  `ysnows/enconvo_docs`, or the owner adds it in the Vercel dashboard if the
  project is not git-linked.
- **Search Console connected.** Read the 28-day baseline (113 clicks, 2,650
  impressions, position 10.7; details in `STATE.md`). It confirms the homepage
  as the money page. It also shows that non-branded visibility is near zero
  and that `docs.enconvo.com` still draws about 850 impressions a month.
- **GA4.** The owner's Google login sees only property 477108245
  (`G-JBLMBKBEN2`), which has never received data. The site sends to
  `G-X7999CT0H3` (confirmed in the browser), which is in another account.
  Key events cannot be marked until the owner opens that account.
- **Weekly loop.** A scheduled agent was not set up: session-only cron jobs
  expire, and a cloud agent cannot use the signed-in Search Console. Wrote the
  weekly routine into `BRIEF.md` instead.
- **Off-site.** Drafted listicle pitches and directory corrections in
  `outreach.md`. Nothing sent.
- Verified on a local production build (`next start`): build passed. The
  discovery, navigation and social-preview checks passed. SSR shows the new
  H2s and kickers, no "14-day" on `/`, the new refund text in Terms, `/okara`
  404, `/pricing` 307 → `/#pricing`, `/developer` noindex. Desktop screenshots
  of all four sections look right. Mobile wrapping was not checked.
- Next, after deploy: request indexing for `/` in Search Console, mark both
  events as key events in the right GA4 property, then leave the page alone
  for four weeks and compare against the baseline in `STATE.md`.

## 2026-09-24 — GA4 switched to the owner's property

- The owner chose property "enconvo.com" (477108245, web stream
  `G-JBLMBKBEN2`, under their signed-in account). `src/pages/_app.tsx` now
  loads and configures `G-JBLMBKBEN2` instead of `G-X7999CT0H3`.
- Effect: once deployed, page views and both conversion events go to a
  property the owner can read. The old property stops getting data. The GA4
  history starts on deploy day, so the four-week before/after comparison for
  the heading change relies on Search Console, and GA4 only covers the after
  period.
- Key events could not be created ahead of time. The GA4 events hub has only
  the star toggle on received events and no "new key event by name". After
  deploy, star `download_click` and `begin_checkout` under Admin → Events →
  Recent events.
- Verified: isolated production build passed. `G-JBLMBKBEN2` is in the
  built `_app` chunk, and `G-X7999CT0H3` appears 0 times in `.next`.
