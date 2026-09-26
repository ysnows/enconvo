# Task discovery refinement — 2026-09-27

Status: Finished (local implementation and verification; not deployed).

## Reference and decisions

Reviewed [Skillry's skills gallery](https://skillry.dev/#skills) and the public
[Cadence Marketing Landing example](https://skillry.dev/skills/bs-cadence-marketing-landing).
The useful patterns were visible results before long capability descriptions,
task/category discovery, and a clear next action beside each preview. No Skillry
package was installed and no artwork, testimonials, or marketing claims were copied.

Enconvo keeps its existing Crystal surfaces, system typography, subtle strokes,
compact controls, and real product footage. The implementation uses the existing
Next.js, Tailwind, and Headless UI dependencies.

## Changes and affected surfaces

- Home: a secondary first-screen action leads to `#features`; six curated, real
  walkthroughs now follow the hero. Images lead to the exact existing video
  anchors instead of every capability card linking to a generic catalogue.
- Home and `/use-cases`: a shared gallery provides category filters, search,
  result announcements, clear/reset actions, and a useful empty state. Search
  matches all words across titles, descriptions, and categories, ignoring case,
  surrounding whitespace, and accents such as `Résumé`.
- `/use-cases`: all 13 existing videos and stable slugs remain available,
  newest first. The player uses Headless UI Dialog for initial focus, trapping,
  Escape dismissal, scroll locking, and focus restoration. Hash updates preserve
  Next router history state and incoming query parameters; clearing/changing a
  hash updates the player. Cards are real keyboard-accessible links, including
  modified-click/open-in-new-tab behavior.
- Loading: standard YouTube thumbnails are lazy-loaded with reserved geometry
  and an error fallback. Iframes are created only when opening a walkthrough.
- Hero: critical first-paint CSS was updated alongside normal CSS; the existing
  video controls, download URLs, and download analytics handlers are retained.
- Navigation consumers reviewed: homepage, use cases, and changelog. Auth,
  payment, account, API endpoints, analytics registrations, and shared navigation
  components were not edited. Existing `ItemList`/`VideoObject` facts, canonical
  URLs, homepage structured data, sitemap, and crawler content were preserved.

## Verification

- `npx tsc --noEmit --incremental false`: passed in the working checkout.
- `pnpm install --frozen-lockfile`, then `npm run build`: passed in an isolated
  source copy using the repository's existing pnpm lockfile; lint, type checking,
  production compilation, and generation of 27 static pages passed. Source
  formatting after the snapshot did not change behavior. Production preview ran
  on port 3116. No dependency manifests or lockfiles were changed.
- `npm run lint` with the checkout's pre-existing npm dependency tree: failed
  because `@typescript-eslint/parser` 5.29.0 calls the removed
  `originalKeywordKind` API in TypeScript 5.2.2, including in unchanged files.
  The frozen pnpm tree uses parser 5.62.0 and passes lint during the full build.
- `SITE_CHECK_URL=http://localhost:3116 node scripts/check-use-case-discovery.mjs`:
  passed search/category edge cases, shared-data immutability, all six featured
  destinations, initial SSR of both consumers, lazy thumbnails, no initial iframe,
  and complete catalogue structured data.
- `SITE_CHECK_URL=http://localhost:3116 node scripts/check-homepage-discovery.mjs`:
  passed crawler content, canonical URLs, sitemap, metadata, and private-page
  noindex checks.
- `NAV_CHECK_SITE=http://localhost:3116 node scripts/check-homepage-navigation.mjs`:
  passed shared header/footer destinations on home, use cases, and changelog,
  including signed-in/out navigation definitions.
- `node scripts/check-visible-video.mjs`: passed visibility, manual pause, sound,
  reduced motion, data saving, asynchronous playback race, and cleanup checks.
- `HERO_CHECK_SITE=http://localhost:3106 node scripts/check-hero-first-paint.mjs`:
  browser probe passed at 390px and 1440px; all six geometry differences between
  critical and fully styled markup were zero.
- Browser checks: 390px mobile and 1440px desktop layouts without horizontal
  overflow; all six home thumbnails loaded; 44px category touch targets; search,
  category intersections, empty-state reset, keyboard Enter to open, Escape to
  close, focus trap and return to the invoking card; direct homepage-to-video
  navigation and use-cases-to-home Pricing navigation. Production smoke checks
  passed category selection, opening the matching dialog, dismissal and shared
  navigation. No console errors were captured in the production preview.
- `git diff --check`: passed. Module builds: not applicable (no `modules/` changes).

## Residual risk

The gallery is shared by two pages, both checked above; the intended side effect
is that Features navigation now lands on task previews. YouTube thumbnails and
embedded playback remain network/third-party dependencies. Thumbnail failures
have a readable fallback, and the player retains its external YouTube link;
playback availability in every network region is not established by these checks.
No live purchase, login, deployment, or performance score improvement is claimed.
The local npm/parser incompatibility remains until dependencies are reconciled;
the existing frozen pnpm install is the verified build path. Existing unrelated
hook warnings, stale Browserslist data, and changelog-size warnings remain.
