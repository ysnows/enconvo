# Landing page visual refinement — September 2026

Status: implemented and verified locally on 2026-09-10; not deployed. Standard lint-enabled build remains blocked by the existing parser incompatibility described below.

## Confirmed brief

- On 2026-09-10, the user chose visual quality as the priority and explicitly requested preserving the existing copy and information structure.
- The user selected a restrained native Mac visual character: precise spacing, thin materials, clear selection states, and prominent real product media within the existing dark Crystal style.
- The user chose to retain centered hero copy above a wide product demonstration, tightening vertical whitespace so the video appears earlier; a split text/video hero was considered and rejected because it reduces the legibility of the recorded app interface.
- The user accepted a single horizontally scrollable row of hero tabs on mobile, preserving all labels and their order, making the active tab clear, and leaving the next item partially visible to signal more content. This prioritizes the demonstration's visibility over showing every capability simultaneously.
- The user initially accepted lightweight state transitions only, leaving the existing video playback mode in place. The later hero enhancement below adds an explicitly requested decorative entrance effect to the hero only.
- Refine the homepage's visual presentation: composition, spacing, typography, surfaces, controls, media framing, and responsive presentation.
- Preserve section order, product positioning, feature content, pricing content, and destination behavior. Any later proposal to change these requires a scope discussion.
- Follow the workspace Enconvo Crystal language in `../../DESIGN.md`, with the website's `../DESIGN.md` as supporting guidance.

## Working baseline

- Use the current local homepage as the working baseline; the public website still serves an earlier homepage.
- The local site is available at `http://localhost:3001/` and uses the positioning line “The assistant your Mac was promised.”
- Existing uncommitted edits in `src/data/heroShowcase.tsx` add updated dictation and meeting videos and change the showcase's tab set. Preserve these edits.
- The July design record (`homepage-redesign-2026-07.md`) and the workspace glossary's fixed seven-tab list predate the current six-tab implementation. Treat those lists as historical, not instructions to restore removed tabs.

## Initial observations

These are inspection findings, not measured conversion or performance results.

- At the observed desktop viewport of 1280 × 720, the demo frame begins at approximately y=656, leaving most of the product demonstration below the initial viewport.
- At 390 × 844, the six hero tabs wrap into four centered rows and the video frame begins at approximately y=793. The selector and reserved spacing substantially delay the product visual on mobile.
- Hero tabs use similar dark surfaces and borders for selected and unselected states; their visual hierarchy can be strengthened.
- The showcase reserves an invisible sub-scene row for single-scene tabs. This stabilizes height but contributes to the gap above the video.
- Model and platform sections repeat centered headings and framed text cards; visual rhythm can be refined while retaining their order and content.

## Implementation decisions

- Use homepage-scoped CSS and preserve shared SiteNav, Footer, Container, authentication, and checkout implementations.
- Use a compact segmented tab row, horizontal native scrolling, arrow/Home/End keyboard navigation, and explicit active/focus states.
- Keep a compact sub-scene control slot so automatic tab rotation does not shift the video frame.
- Keep video controls visible for touch and keyboard focus; use 44px video buttons and a 44px seek hit area on small screens.
- Synchronize video duration on mount, scene changes, and metadata/duration events so cached media loaded before hydration still has a usable seek range.
- Preserve reduced-motion rotation suppression after manual interaction.
- Keep comparison tables readable at narrow widths through local horizontal scrolling, with a keyboard-focusable region.

## Impact and verification plan

- Primary impact: homepage hero, showcase, and marketing section presentation.
- Shared navigation, pricing, footer, typography, and global styles also serve other pages; inspect their consumers before modifying shared styling.
- Preserve download destinations, authentication/account navigation, pricing selections, and checkout behavior.
- Implementation verification should cover desktop and mobile layout, active and focus states, video controls, navigation, and any affected shared surfaces, plus appropriate project checks.
- Verification completed below. Original uncommitted showcase data matches the pre-implementation snapshot byte for byte.
- User-facing entries and verification notes are recorded in `../../changelogs/v2.5.5-beta-32.md`. Beta 31 was concurrently rewritten as release-facing DeepSeek notes, so this task records its work in the next beta file without overwriting that release draft. No module code changed, so module builds are not applicable.

## Documentation policy

Use the existing website glossary in `../../CONTEXT.md`; add or refine terms only when a project-specific concept is actually resolved. Record an ADR only for a consequential decision with a real trade-off and meaningful reversal cost. Routine visual choices belong in this design record.


## Verification results

Commands were run against the final implementation, with the production build in an isolated temporary copy to avoid disrupting the development server.

- `npx tsc --noEmit --incremental false`: passed.
- `git diff --check`: passed.
- `npm run build`: failed at the repository's existing ESLint/TypeScript parser incompatibility (`originalKeywordKind`), also reported by unchanged files across the project.
- `npm run build -- --no-lint`: passed type validation, production compilation, and generation of all 28 static pages. Repeated after the cached-media duration fix and final styling changes.
- Existing build warnings remain for stale Browserslist data and the changelog page's large data payload. They are outside this homepage change.

### Browser regression checks

The repository has no existing browser/component test harness. Focused interactions were exercised in the real local browser instead of adding a new test framework for a presentation update. This matrix records repeatable acceptance checks for the shared showcase and pricing controls.

| Area | Scenario | Result |
| --- | --- | --- |
| Content preservation | Compare normalized text for all seven content sections, all 34 headings, and all 29 link labels/destinations against the pre-change browser snapshot | Identical |
| Desktop composition | Inspect 1280 × 720 | Video begins at y=543 instead of approximately y=656; frame is 1120px wide; no horizontal page overflow |
| Mobile composition | Inspect 390 × 844 | Video begins at y=507 instead of approximately y=793; frame is 350px wide and fully visible within the first screen |
| Narrow and tablet layout | Inspect 320px and 768px widths | No horizontal page overflow; hero tabs stay in one scrollable row |
| Showcase regression | Select all six hero tabs and the second Knowledge Base video | Every tab retains its original media URL and order; exactly one tab is in the keyboard tab sequence; at 320px the panel remains at document y=573 for all six tabs |
| Keyboard tabs | Use End, Home, and ArrowLeft from the first tab | Focus and selection agree; wrapping works; the active tab scrolls into the horizontal selector without scrolling the page |
| Knowledge Base placeholder | Select Quick Capture | Correct caption and existing placeholder remain visible; sub-scene controls scroll horizontally |
| Cached media | Reload the cached App Sidebar video | Slider maximum equals video duration (54.016s), including media loaded before hydration |
| Playback controls | Pause, toggle sound on/off, seek Home then ArrowRight, enter and exit fullscreen, resume | Pause and mute state update; video and slider both reach 0.1s; exit-fullscreen control becomes available; playback resumes |
| Focus and touch targets | Tab from the selected hero tab into video controls at 320px | Visible focus outline; control overlay becomes visible after its short transition; sound/play/fullscreen controls and seek input have 44px height |
| Download menu | Open and close at 320px | Menu stays within x=16…304; Apple Silicon and Intel download URLs are unchanged |
| Mobile navigation | Open and close the mobile menu | Both actions work |
| Pricing | Increase Teams from 5 to 6 seats, restore 5, select annual, restore monthly | State updates; annual prices are $8/$40/$80 with $96/$480/$960 yearly totals; monthly state restores |
| Comparison tables | Focus Cloud comparison at 320px and press ArrowRight | Region scrolls 40px horizontally while the page stays 320px wide; focus outline is visible |
| Shared consumers | Open Use Cases, Changelog, and Login at 768px | Pages render without the homepage wrapper; existing 81px shared navigation remains on Use Cases and Changelog; no horizontal overflow |

### Verification limits and residual risk

- Standard lint-enabled build remains blocked by the pre-existing parser issue; no dependency or lint configuration was changed.
- Device checks used responsive browser viewports, not physical iPhone/Safari hardware. The coarse-pointer visibility and reduced-motion/reduced-transparency rules were reviewed in source; operating-system accessibility preferences were not changed during verification.
- Authentication and payment handlers are unchanged. Navigation, displayed pricing, and selection controls were checked; no real sign-in or payment was submitted.
- No analytics events, public deployment, or release publication were performed.

## Follow-up: hero light and typography

On 2026-09-10, the user supplied an Aura landing-page reference and requested a more premium hero through background and text effects. Apply its silver-blue light, polished type, and glass-edge treatment to Enconvo's existing centered hero. Existing copy, section structure, and real product demonstrations remain the baseline.

- Add a local, non-interactive backdrop with a diagonal refracted band, faint edge guides on larger screens, and static fine grain. Fade the decoration out before the next section.
- Render “Mac was promised.” in readable cold silver, with one 4.2-second sheen on entry. The background reveals over 1.4 seconds on desktop and is static on mobile. Neither decoration loops.
- Add a soft highlight to the white download button and a one-pixel reflective edge on the demo frame. Hide the frame highlight in fullscreen.
- Implement the effect with scoped CSS and a small inline SVG grain texture; add no library, background video, or remote asset request.
- Respect reduced motion by disabling both animations. Hide the decorative backdrop for reduced transparency and increased contrast; use solid text in increased contrast and forced colors. Decoration is hidden from assistive technology and cannot intercept input.

### Fresh follow-up verification

- `npx tsc --noEmit --incremental false` and `git diff --check`: passed.
- `npm run build -- --no-lint`: passed production compilation, type validation, and all 28 static pages in the isolated build copy. The previously diagnosed standard lint parser incompatibility remains unresolved; the lint-enabled command was not repeated for this CSS refinement.
- Browser checks at 320, 390, 768, and 1280px: no horizontal page overflow. Desktop video top remains y=543.78; mobile video top is y=508.38 at 390px and y=573.88 at 320px (video interior measurements).
- All heading strings and link labels/destinations match the snapshot immediately before this follow-up. The headline still exposes the same single accessible heading.
- The download menu opens within x=16…304 at 320px and retains both architecture URLs. Escape closes it. Arrow-key showcase navigation updates focus, selection, and media together. Pause, fullscreen entry/exit, and resume remain usable.
- The browser's computed headline animation is 4.2 seconds with one iteration; the decorative container has `pointer-events: none`. Accessibility preference fallbacks were reviewed in source, without changing the user's OS settings.
- Impact review: Hero and HeroShowcase are consumed only by the homepage. This follow-up changes only Hero markup and hero-related CSS; it introduces no shared component behavior change. No `modules/` code changed. Physical Safari/iPhone rendering remains unverified.
- Follow-up recorded in `../../changelogs/v2.5.5-beta-32.md`; not deployed.

## Follow-up: stronger aurora backdrop

The user subsequently asked for a more striking background. Replace the faint straight refraction with two interwoven curved light ribbons: teal-to-blue with a small violet highlight, fine parallel filaments, and soft bloom. A dark central veil protects copy contrast, while the ribbons frame the existing content. Keep the headline treatment and all layout measurements from the preceding refinement.

- `HeroBackdrop.tsx` encapsulates the decorative SVG. Gradient/filter identifiers use React's stable unique ID; no image/video download, dependency, canvas, or JavaScript animation loop is introduced.
- The light ribbon reveals and its bright edge draws once over 4.6 seconds. Mobile uses a stable crop and omits the ribbon transform. Reduced motion disables all decorative animation; reduced transparency, increased contrast, and forced colors retain their static fallbacks.
- Darken the showcase tab surface to preserve inactive-label contrast where the stronger light passes behind it.
- Fresh verification: TypeScript and whitespace checks passed; isolated `npm run build -- --no-lint` passed production compilation and generation of all 28 static pages. The known lint parser issue remains outside scope. No `modules/` build applies.
- Inspected 320, 390, 768, and 1280px browser widths without page overflow. The video retains its preceding positions (y=543.78 at 1280px and y=508.38 at 390px). All headings and links match the pre-effect snapshot.
- At 320px the download menu remains inside x=16…304 with both original download links. Keyboard selection and focus agree after clicking the initial tab and pressing ArrowRight. The decoration is hidden from assistive technology, ignores pointer events, and uses non-focusable SVG. Browser styles confirm one 4.6-second light trace.
- Scope: only the homepage backdrop and its tab surface. Existing media, navigation, account, and payment behavior is unchanged. The existing lack of physical Safari/iPhone and device performance testing remains a limitation; accessibility preferences were source-reviewed.
- Recorded in `../../changelogs/v2.5.5-beta-32.md`; not deployed.

## Follow-up: seamless navigation at the top

The user requested a continuous hero/navigation background at the top, with the distinct menu surface appearing only once the page scrolls away from the top.

- Extend the hero artwork behind the navigation and remove its default visible surface and divider on the homepage. A soft 120px top vignette keeps navigation labels readable without a hard horizontal boundary.
- Once `scrollY` exceeds 24px, fade in the existing dark glass and hairline over 180ms; return to transparent at or below that threshold. Initialize from the actual scroll position and resynchronize on `pageshow`; clean up both event listeners on unmount.
- Keep the state inside Hero and the presentation inside homepage-scoped CSS. The shared `SiteNav` component is unchanged, including its mobile dialog and account/navigation behavior.
- Reduced motion removes the fade; reduced transparency and forced colors replace the glass with an appropriate solid surface while retaining the same top/scroll state behavior.
- Fresh TypeScript and whitespace checks passed. The isolated production build with `--no-lint` passed all 28 static pages. The existing lint parser incompatibility remains outside scope; no module build applies.
- Desktop checks confirmed transparent background and border at y=0, visible glass at y=160 and y=601, and transparent restoration at the top. Mobile checks confirmed transparency at y=17 and glass at y=34, working menu open/close, and a fixed header at y=253. No page overflow at 320, 390, and 1280px; desktop video placement remains y=543.78.
- Direct entry and refresh at `/#features` both restored the elevated state at y=4136. A normal root refresh starts correctly at the top. The browser tool resets ordinary root-page scroll on reload, so that operation did not exercise native non-anchor scroll restoration.
- The Use Cases page retains its original solid navigation, divider, and 81px header height. CSS scope and unchanged shared navigation prevent this effect from propagating to other pages.
- During verification, the development server's generated page cache became invalid and served a 404. Archived the generated cache and restarted the local preview; fresh root, route, and anchor reloads then passed. Production compilation was unaffected.
- Remaining limits: physical Safari/iPhone and native browser history restoration are unverified; accessibility preferences were source-reviewed. Recorded in Beta 32; not deployed.

## Follow-up: continuously animated DarkVeil

The user clarified that the background must keep moving and supplied the full React Bits DarkVeil component. This supersedes the earlier one-shot-only background decision. The silver headline entrance and seamless top navigation remain intact.

- Adapt the supplied shader into a typed, client-loaded DarkVeil component using OGL 1.0.11. Apply a blue hue shift and continuous time-driven distortion. The previous SVG remains a static loading/unsupported-WebGL fallback.
- Keep the source attribution and [upstream license](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md), including the public copy at `/licenses/react-bits-darkveil.txt`. The OGL integration follows its [primary renderer documentation](https://github.com/oframe/ogl).
- Add a compact pause/resume button beside the macOS requirements. It sits in the existing spacing, preserving video placement; mobile has a 44px target that does not overlap Download.
- Cap rendering near 30fps, reduce resolution on narrow displays, and pause when outside the viewport or when the document is hidden. Resume from the previous animation time. Reduced motion renders a static frame, and reduced transparency/high-contrast preferences hide the decoration and its control.
- Match shader resolution to the actual drawing buffer, including pixel ratio; observe element resizing. Cancel the frame loop, disconnect observers/listeners, and delete graphics resources on unmount. Handle WebGL context loss with the static fallback and rebuild on restoration.
- Dependency manifests and both locks add only OGL; no previously locked package versions change. The existing npm manifest/lock drift and Stripe peer-range conflict required legacy peer resolution for local installation. The local install refreshed already-declared dependencies; Login and route/build regressions were checked, without submitting authentication or payment.

### Continuous-background verification

- Fresh TypeScript and `git diff --check` passed. The final isolated production build with `--no-lint` compiled and generated all 28 static pages. Focused lint on the four React/shader files reproduces the existing `originalKeywordKind` parser failure. An isolated frozen pnpm lock check passed.
- Successive screenshots, including after the original entrance duration, show continuing changes in the light field. Pause leaves the image unchanged across subsequent screenshots; Resume restarts motion. At scroll y=1607 the canvas reports paused and the navigation is elevated; returning to the hero resumes rendering.
- At 390px the canvas renders at 273 × 520; at 320px it renders at 224 × 520. These drawing-buffer sizes track the 0.7 mobile resolution scale. Both narrow layouts have no page overflow; the 320px download menu remains within x=16…304.
- The 44px pause target does not intersect Download. Video placement remains y=543.78 at 1280px and y=508.38 at 390px. All heading strings and link labels/destinations match the pre-effect snapshot.
- Login loads its email/password form with no background canvas. Returning to the homepage creates one ready canvas. Background, navigation, downloads, and product media retain separate state.
- WebGL-unavailable/context-loss handling, hidden-tab behavior, and OS preference changes were source-reviewed; they were not forced on the user's browser/system. Physical Safari/iPhone, battery/GPU profiling, and real payment submission remain unverified. No module code changed, so module builds do not apply.
- A route-return hydration warning exposed a stale development server bundle: its compiled server files lacked the new pause button while the client had it. Archived the generated cache and restarted the preview. Fresh root reload and a repeated Login → Home cycle then displayed one running canvas and one pause control without the error overlay. This did not require a source change; the final production snapshot already contained the matching markup.
- Recorded in `../../changelogs/v2.5.5-beta-32.md`; verified locally, not deployed.


## Follow-up: refined lower sections inspired by React Bits

The user asked for more premium UI below the hero, referencing React Bits. Keep all seven section texts, headings, destinations, prices, ordering, and billing behavior. The earlier continuous DarkVeil hero and transparent-to-glass navigation remain part of the accepted design.

### Direction and implementation

- Reference the pointer-local light of [React Bits SpotlightCard](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/SpotlightCard/SpotlightCard.jsx) and the modular visual hierarchy of [MagicBento](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/MagicBento/MagicBento.jsx). Implement a small homepage-specific enhancement using the existing React and CSS stack; no additional dependencies, particle system, or scroll replacement.
- Model freedom now uses an asymmetric introduction alongside a responsive provider matrix. Reuse fourteen existing provider images; generic wave/chip symbols accompany the two entries without local brand assets. Keep all sixteen provider names visible. Separate the three ownership/privacy claims with vertical hairlines.
- Open Platform uses four illustrated cards in a two-column grid. Original decorative diagrams represent server connections, plugin tiles, skill documents, and workflow branching; they are not product screenshots and are hidden from assistive technology.
- Desktop Pet and IM Channels gain original, compact desktop/phone diagrams. The pet has a tiny hover lift; the phone and plugin sheet gently straighten on hover. All movement is opt-in through the browser's no-reduced-motion preference.
- Add a soft pointer-following surface highlight, clearer feature-link arrows and keyboard outlines, and a one-time 16px/520ms section entrance. Server-rendered content is visible by default, without a hidden-class dependency. Pointer work is limited to the active card and at most one pending animation frame. Listeners, observers, and running animations are cleaned up when the homepage unmounts.
- Refine testimonial spacing and stagger the columns; fix the quotation symbol's missing SVG viewBox. Keep all six quotes and author details. Give pricing a clearer type hierarchy and restrained emphasis for the existing recommended plan. Preserve the two comparison tables and their horizontal keyboard access.
- Keep FAQ answers expanded, with a sticky editorial heading beside a readable answer column on desktop and a normal single-column layout on mobile. Use subtle section dividers and a consistent 96px desktop / 56px mobile rhythm.
- Raise the homepage hero stacking context so its fixed navigation stays above the newly isolated card surfaces and entrance animations. Shared SiteNav and other page headers are unchanged.

### Impact and fresh verification

- Scope: the seven lower homepage sections, their shared homepage CSS/effect hook, and the hero stacking context. Reviewed all thirty spotlight consumers across informational cards, feature links, testimonials, and pricing. No checkout, authentication, provider, analytics, or product-module behavior changed.
- Fresh `npx tsc --noEmit --incremental false` and `git diff --check` passed. An isolated production build (`npm run build -- --no-lint`) compiled and generated all 28 static pages; output is recorded in `/tmp/enconvo-lower-sections-build.log`. No `modules/` code changed, so module builds do not apply.
- Focused lint on both new files still fails at the repository's existing TypeScript/ESLint `originalKeywordKind` parser incompatibility. It is not a source diagnostic; dependency changes remain outside this visual refinement.
- Compared browser DOM snapshots before/after: all seven normalized section texts, all headings, and all link text/destinations are unchanged. All fourteen provider images load. The original hero showcase data was not edited in this follow-up.
- Browser layouts checked at 320, 390, 768, and 1280px. Narrow and tablet pages have no horizontal document overflow or text extending beyond the viewport. Inspected model matrix, platform diagrams, companion scenes, features, testimonials, pricing, and FAQ. Final 320px refinement shrinks the plugin mosaic and lets connector lines compress, keeping diagram endpoints visible; the mobile menu also opens/closes correctly over the new cards.
- Pointer interaction illuminates the active plugin card at the measured cursor position and clears on leaving. The plugin diagram responds without moving its card or text. Keyboard Tab reaches feature links with a 2px blue outline; their highlight settles at full opacity. Enter opens Use Cases. All entrance groups settle to opacity 1.
- At 320px, Teams changes from 5 to 6 seats ($159, $26.50/seat, 300,000 points), then back to 5. Annual billing shows Plus $8 / Pro $40 / Max $80 with $96 / $480 / $960 yearly totals, and Monthly restores the original prices. The cloud comparison table scrolls with ArrowRight while its region keeps a visible focus ring. No checkout was submitted.
- Use Cases retains its original 81px header and has zero homepage spotlight elements or canvas. Returning to Home and performing a full reload succeeds without hydration overlay or captured console errors. The hero has one ready, running canvas, transparent header at the top, and the same desktop video position (y=543.78). The glass navigation stays above scrolled cards.
- No dedicated DOM/interaction test harness exists in this repository; the targeted browser checks above cover the new shared surface. Reduced-motion, reduced-transparency, forced-color, no-observer, and cleanup paths were source-reviewed rather than changing the user's OS settings. Physical Safari/iPhone and performance/battery profiling are not verified.
- Tracked in `../../changelogs/v2.5.5-beta-32.md`; local preview only, not deployed.


## Follow-up: stable Hero on refresh

The user reported a brief initial frame where the video covered the Hero copy and expanded across the viewport. This is a loading-order bug, not a requested visual change.

### Cause and reproduction

The video's absolute positioning and full-size rules came from the global utility stylesheet, while its containing block, aspect ratio, text sizing, and spacing came from the page CSS module. During development those styles can arrive in separate JavaScript chunks. With only global utilities available, the real server-rendered player is static and only 24px tall; the video instead anchors to the outer Hero and starts at y=0, covering the heading.

The reproduction uses the actual homepage SSR markup with the page JavaScript and module CSS held back. It fails with a 1280px-wide video at y=0 and a 24px player. Reducing the fixture to only the Hero keeps the failure. Removing the media source still fails with `readyState=0`, and scrollY remains zero, ruling out intrinsic media metadata and scroll restoration as the cause of the reproduced frame. Providing the existing page CSS alone restores the correct geometry without any application JavaScript.

### Fix

- Add a homepage-only `HeroLayout` head style containing the critical text, navigation, selector, and media geometry. It is present in the original HTML, before hydration or page CSS delivery. It preserves the normal responsive layout and reserves the 16:9 video area immediately.
- Keep decorative artwork hidden until its regular CSS is available, using a lower-specificity fallback. The existing animated background, title sheen, and accessibility overrides then take over without changing layout.
- Co-locate positioned media rules with the player's containing-block rules in `Home.module.css`; videos, images, and placeholders share `playerMedia`. Global utilities no longer position a video before its container is ready.
- The head style is removed on leaving Home. Shared navigation, checkout/auth handlers, prices, content, and other pages remain unchanged.

### Regression coverage and verification

A maintained browser fixture is available with `node scripts/check-hero-first-paint.mjs` while the site runs on port 3001 (or set `HERO_CHECK_SITE`). Open the printed local address. It renders the real SSR Hero both without and with page CSS, checks title sizing, video containment, aspect ratio and maximum width, then compares heading/video positions and player dimensions. Both individual modes and the comparison must report PASS. The fixture runs only on a temporary local server and is not part of the shipped website.

The initial fixture was observed failing before the fix. After the fix, all five assertions and all geometry comparisons passed at these widths:

| Viewport width | Video top before page CSS | Video top after page CSS | Position / width / height delta |
| --- | --- | --- | --- |
| 320px | 573.875px | 573.875px | 0 / 0 / 0px |
| 390px | 508.3828125px | 508.3828125px | 0 / 0 / 0px |
| 768px | 530.1875px | 530.1875px | 0 / 0 / 0px |
| 1280px | 543.78125px | 543.78125px | 0 / 0 / 0px |

- The real homepage refresh displays one head guard, one ready running background canvas, correct player bounds, and no captured browser errors or hydration overlay.
- Verified video pause/resume, fullscreen entry/exit with contained media, knowledge-base scene switching, and the Quick Capture placeholder (628px content inside a 630px player at desktop width). Download still exposes both Mac architectures.
- Use Cases has zero Hero head guards/canvases and retains its 81px header; returning to Home restores the normal layout. The changes stay within the homepage and its shared media layout.
- Fresh TypeScript, JavaScript syntax, whitespace checks, and an isolated production build passed; the build generated all 28 static pages. Log: `/tmp/enconvo-first-paint-build.log`. The existing ESLint parser incompatibility remains; no module code changed, so module builds do not apply.
- Prevention: keep media and its containing block in one stylesheet, and rerun the critical-versus-styled fixture whenever Hero geometry changes. The small critical subset intentionally mirrors layout rules; the comparison catches drift. Physical Safari/iPhone, device throttling, and unrelated checkout flows were not exercised. Temporary diagnosis servers were stopped and their browser tab closed.
- Tracked in `../../changelogs/v2.5.5-beta-32.md`; local only, not deployed.

## Follow-up: one immersive ribbon background

The user's second screenshot selects the fine cyan/blue/violet SVG ribbons.
This supersedes the earlier DarkVeil loading/fallback arrangement: that setup
rendered the SVG first, then covered it with the client-loaded canvas, producing
two visibly different backgrounds during refresh.

- `HeroBackdrop` now renders only the selected ribbon artwork. The original
  paths drift slowly with a traveling edge highlight; there is no renderer swap.
- The complete, scoped background CSS is emitted in the SSR head. The first
  paint already includes the same artwork, shading, masking, and responsive
  geometry; hydration starts motion on that artwork. The earlier hidden-artwork
  fallback and fixed 824/744px background heights were removed.
- Coverage follows the entire Hero. An additional lower ribbon and subtle halo
  continue beneath the video and fade into the next section. At 1280px, coverage
  is 1292.78125px high and extends 120px below the player.
- Pause freezes the current frame, resume continues it, and the background stops
  when offscreen or the document is hidden. Reduced motion keeps static ribbons;
  reduced transparency, increased contrast and forced colors hide decoration.
- `check-hero-first-paint.mjs` additionally asserts one background/no canvas,
  visible SSR artwork, full Hero coverage and extension below the player. At
  320, 390, 768 and 1280px, all eight assertions pass and all six before/after
  geometry deltas are zero, with app scripts and page CSS withheld.
- Verified actual changing transform/highlight values, identical paused values,
  offscreen pause/resume, desktop/mobile screenshots, and a refreshed page with
  no captured browser errors. Use Cases has no background style or markup;
  returning to Home restores exactly one backdrop. Production HTML also has one
  backdrop, its complete style in the head, and no replacement canvas.
- Fresh TypeScript, fixture syntax, whitespace and isolated production build
  checks passed; the build generated all 28 static pages. Current background
  source matches that build. Log: `/tmp/enconvo-aurora-build.log`. The build used
  `--no-lint` due to the previously recorded parser incompatibility. No modules
  changed. Physical Safari/iPhone and OS accessibility settings were not manually
  exercised; preference rules were reviewed.
- Impact is homepage decoration only. Video layout/controls, text, pricing,
  checkout and shared navigation behavior are preserved. Recorded in Beta 32;
  not deployed.

## Follow-up: preserve the showcase sound choice

The user expects enabling sound once to apply to the remaining demo videos.
`select()` and `advance()` previously reset `soundOn` to false on every manual
or automatic transition. Remove those resets: sound remains a showcase-level
choice for the current page visit, including transitions through sub-scenes.
Fresh page loads still begin muted.

Consecutive videos reuse their media element while changing `src`, retaining
the element's playback permission. This follows [WebKit's guidance for back-to-back playback](https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/).
Existing load/metadata events continue resetting progress and updating duration.
The sound control uses a functional state update. No changes to video assets,
rotation timing, layout, pricing, or other pages.

Focused browser regression procedure (repeat after changing showcase playback):

1. Reload: first clip plays muted with “Play with sound”.
2. Enable sound, then select the second tab: it plays unmuted with “Sound on”.
3. Select Knowledge Base and its second video: sound remains enabled, and each
   clip's duration/progress is refreshed.
4. Visit a placeholder and return to a video: retain the sound choice.
5. Let a video end after the 20-second interaction pause has expired: the next
   clip must play with the same sound choice. Repeat with sound disabled.
6. Mute, switch manually, then enable sound again: all following clips should
   reflect the latest choice. Reload: initial muted behavior remains intact.

Initial reproduction confirmed the second clip reset to muted. After the fix,
manual tab/sub-scene transitions and the first-to-second automatic transition
were verified with actual media state (`muted: false`, `paused: false`). Muting
then selecting PopBar retained `muted: true`, and its automatic transition to
Voice & Dictation also remained muted and playing. Quick Capture had no media;
returning to the second knowledge-base video restored unmuted playback.
Reload returned to muted playback, and no browser errors were captured.
Duration/progress updated correctly
between 54.016, 71.104, 123.093 and 24.341-second clips. The repository has no
component/browser test runner; the live media checks above exercise the native
autoplay and event behavior that a mocked React test would not validate.

Fresh `npx tsc --noEmit --incremental false`, whitespace checks and an isolated
`npm run build -- --no-lint` passed (28 static pages). Build log:
`/tmp/enconvo-sound-preference-build.log`. The prior lint parser limitation
remains; no modules changed. Physical Safari/iPhone autoplay settings were not
tested. Impact is the shared homepage showcase across all tabs/sub-scenes;
the expected behavior change is preserving the sound preference. Local only,
tracked in Beta 32.

## Follow-up: visibly flowing ribbon geometry

The prior 18-second, 2% group translation was running, but too subtle to read
as a moving background. The user's correction calls for visible continuous
motion while preserving the selected ribbon artwork and full Hero coverage.

`RibbonPath` now interpolates matching SVG path commands between two curved
shapes and back. The main, return and lower ribbons cycle at 10, 12 and 14
seconds, with their bloom and fine strokes sharing the same geometry. Edge
highlights travel along all three at 5, 7 and 6 seconds. Native SVG animation
handles the frame updates; React only responds to pause/visibility changes.
Each animation has an indefinite start, so SSR displays the original artwork.
Initialization starts the paused SVG timeline, then the visibility and user
preference controls decide whether it runs. Reduced-motion/contrast settings
keep the timeline paused, and the existing CSS handles static/hidden artwork.

Verification: Computed animated path coordinates and dash offsets changed
across samples for all three ribbons on desktop and mobile. Two manual-pause
snapshots and two offscreen snapshots were exactly equal; resuming restored
motion. Desktop/mobile screenshots confirmed readable copy and full video-area
coverage. The real SSR critical-versus-styled regression fixture passed at
390px and 1280px with all eight checks true and all six geometry deltas zero.
Fresh TypeScript and the isolated production build passed (all 28 static pages),
with `--no-lint` for the existing parser issue. Build log:
`/tmp/enconvo-ribbon-motion-build.log`. No modules changed. Scope is homepage
decoration only; video sound persistence and other interactions are untouched.
Physical Safari/iPhone, OS preference switching and GPU profiling were not
performed. Tracked in Beta 32; local only.

## Follow-up: pricing section redesign

The user requested a fresh UI/UX pass on pricing. Preserve all plan terms,
prices, points, discounts and checkout mappings, including the concurrently
fixed Next Link navigation to `/cloud-pricing`. Keep the two payment models
visible together because they can stack; preserve license-before-Cloud order.

- Introduce a clearer heading and payment-type labels. Standard and Premium
  form a compact side-by-side comparison with prices at the top right, purchase
  buttons before the feature list, and two-column desktop benefits.
- Give Teams a full-width row with a labeled seat stepper, live quote, per-seat
  price and purchase action. The same 5–500 limits and price/bonus formulas apply.
- Cloud cards align plan names, descriptions, prices, billing notes and CTAs.
  Monthly allowances are easier to scan, and Pro has an integrated “Most
  popular” label, restrained tinted surface and brighter purchase action.
  Annual totals occupy a reserved line so changing billing preserves alignment.
- Replace always-expanded comparison tables with native disclosures. All
  original rows remain available, including Free. Add column/row header scopes
  and spoken “Included”/“Not included” labels. Table scrolling is contained;
  feature names remain pinned, with a narrower first column on phones.
- Model/service rates are reachable on mobile. Cards stack without horizontal
  page overflow, and Teams still displays the maximum quote on a 320px screen.

### Verification and repeatable regression checks

- A TypeScript AST comparison against the pre-edit source confirmed exact
  preservation of `startCheckout`, `LICENSE_COMPARISON`, `CLOUD_COMPARISON`,
  `CLOUD_TIERS`, Standard/Premium JSX props, the Teams price formula, clamping
  and seat limits. The baseline was saved at
  `/tmp/enconvo-pricing-before-redesign.tsx` for this check.
- A concurrent update then added GLM-5.3-Flash to the discounted-model copy.
  Preserve it and repeat the AST comparison allowing only that wording change:
  checkout, tier keys, prices, points and limits still match. The longer Pro/Max
  descriptions preserve aligned buttons and feature starts at 768/1280px. The
  final build includes this copy update.
- At 1280px, prices/actions align across both personal licenses and all three
  Cloud tiers. At 768px, all three Cloud purchase controls and feature-list
  starting positions match. Visual checks also passed at 390px and 320px.
- Monthly prices are $10/$50/$100. Annual shows $8/$40/$80 per month with
  $96/$480/$960 billed per year. Switching back restores monthly display.
- Entering 7 Teams seats shows $179, $25.57 per seat and 350,000 bonus points.
  Entering 501 clamps to 500, shows $10,039 and disables increment. Entering
  1 clamps to 5 and disables decrement. Reset to 5 for the delivered preview.
- Both feature disclosures open/close with mouse and keyboard. Their 27/34
  rows remain intact. Arrow-key scrolling moves the table while the document
  stays at viewport width. A positioned scroll container prevents absolute
  screen-reader labels from extending the mobile document's scroll area.
- The rates link navigates to `/cloud-pricing` on mobile and its expected
  heading renders. Returning restores the pricing section. No captured browser
  errors; no live checkout was started.
- Fresh `npx tsc --noEmit --incremental false`, `git diff --check` and an
  isolated `npm run build -- --no-lint` passed; the final build compiled cleanly
  and generated all 28 static pages. Log: `/tmp/enconvo-pricing-redesign-build.log`.
  The previously recorded lint parser incompatibility remains.

The repository has no component/browser test runner, so the checks use actual
browser interactions plus an AST contract comparison rather than simulated
payments. The shared Button, authentication/payment APIs, hero and other
sections are untouched; the changed CSS classes are pricing-only consumers.
Native disclosure defaults and the new hierarchy are the intended behavioral
changes. Physical Safari/iPhone and screen-reader behavior were not exercised.
No modules changed. Tracked in Beta 32; local only, not deployed.

## Production release validation — 2026-09-10

The user authorized publishing the reviewed website after a local production
build, followed by a live check roughly five minutes after pushing. The release
includes the homepage visual refinements, six demo tabs and current videos,
continuous ribbon background, refresh layout fix, persistent showcase sound,
and the redesigned pricing section. Retain the current GLM-5.3-Flash discount
copy in both the pricing cards and model-rate page so they agree with the
already-deployed Cloud catalog. No payment or authentication handlers changed.

Fresh release validation:

- Installed dependencies in an isolated directory with
  `pnpm install --frozen-lockfile`, then ran the unmodified `npm run build`.
  Lint, TypeScript, compilation and all 28 static pages passed. The source
  tree was checked byte-for-byte against the working website. Build log:
  `/tmp/enconvo-release-build.log`.
- The initial local npm dependency tree used parser 5.29.0 and failed against
  TypeScript 5.2.2. The pnpm release lock resolves parser 5.62.0; installing that
  lock and clearing only the isolated directory's previous build output fixed
  the build. No lint rules or build checks were disabled. Existing non-fatal
  hook/image warnings, the old browser database and large changelog data remain.
- Launched the built site with `next start` on port 3106. Checked desktop
  pricing, all three annual totals, collapsed/expanded comparisons and 390px
  mobile scrolling. No page overflow or captured browser errors occurred.
- Repeated the pricing contract comparison: checkout, tier keys, prices,
  allowances, seat limits, team pricing and comparison data are preserved,
  allowing only the already-reviewed GLM model-name copy change.

No real checkout was initiated. Physical Safari/iPhone and assistive technology
remain untested. The Git deployment result and live acceptance evidence will
be recorded in the active root Beta 32 tracking entry after publication.

## Remove the background animation control — 2026-09-10

At the user's request, removed the pause/resume button beside the macOS
requirements. Removed its state, icon imports, unused control styles and
reserved spacing from both the critical first-paint CSS and the full stylesheet.
The requirements text is centered beneath Download on desktop and mobile.
The existing backdrop still runs automatically and retains reduced-motion and
off-screen behavior. Video pause, sound and fullscreen controls are unchanged.

Fresh verification: standard `npm run build` passed with lint/types and all 28
static pages. Log: `/tmp/enconvo-remove-motion-control-build.log`. The existing
first-paint comparison passed at 1280px and 390px with zero geometry differences
between critical and complete CSS. Browser checks found no requirements-row
button or reserved padding, centered text, advancing ribbon/trace motion and
both expected download menu links. Production mobile rendering was visually
checked. No module code changed; no new issue found in the checked homepage
flows. Existing nonfatal build warnings remain. Deployment evidence is tracked
in root Beta 32.
