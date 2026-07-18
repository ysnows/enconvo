# Homepage Redesign Plan — 2026-07

Outcome of the 2026-07-17 design session. Vocabulary for the terms used here
(Positioning line, Hero showcase, Hero tab, Sub-scene, Benefit label, Pricing
dimension groups) lives in the workspace root `CONTEXT.md` under
"Website (enconvo.com)".

## Scope

- **In**: homepage (`src/pages/index.tsx`) full restructure; `src/data/features.tsx`
  stale-name fixes (Companion Orb → Pet, etc.); site-wide meta/OG/SEO copy
  updated to the new positioning.
- **Out**: `/use-cases` (link targets only), `/cloud-pricing` (recently rebuilt,
  untouched), all other inner pages.
- Visual system: **Enconvo Crystal per `DESIGN.md`, unchanged.** We borrow
  kite.video's hero *layout* (tab bar + auto-rotating demo canvas), not its
  purple-glow skin. Demo canvas follows the Product Screenshot Panel spec.
  Restrained single-color light accents allowed on tab selection / behind the
  canvas; no full-screen gradients.

## Positioning

- **H1 (Positioning line)**: `The assistant your Mac was promised.`
  Never name Apple or Siri anywhere in hero copy.
- **Subtitle (draft, to polish)**: `Enconvo is an AI agent that lives across
  your Mac — it sees your screen, works inside your apps, and actually gets
  things done.`
- **Audience**: layered. Top of page = plain language for any Mac user; power
  proof (providers, MCP, own-key, local models) appears from the mid-page down.

## Page structure (top → bottom)

1. **Header / nav** — existing SiteNav; update anchors to new sections.
2. **Hero** — compact H1 + subtitle + Download CTA (keep the arch dropdown).
3. **Hero showcase** — 7 Hero tabs over one auto-rotating demo canvas
   (see table below). Tabs use Benefit labels; the product name appears inside
   the demo panel. Sub-scenes render as chips.
4. **Model freedom** — provider logo wall (OpenAI, Anthropic, Google, Grok,
   DeepSeek, MiniMax, local MLX / Ollama / LM Studio, …) spanning LLM, image,
   video, TTS, transcription. Three hard claims:
   - Bring your own API key — unlimited, free forever.
   - **Use the OpenAI / Anthropic / Grok subscription you already pay for.**
   - Or let Enconvo Cloud handle it; go fully offline with local models.
5. **Open & extensible** — four cards: MCP Servers / 80+ Plugins / Skills /
   Workflows. One line + small screenshot each, no deep dive.
6. **Always with you** — two differentiator bands:
   - **Pet** — animated desktop companion mirroring agent activity;
     Codex pet-pack compatible (animated, the page's delight moment).
   - **IM Channel** — command your Mac's agent from Telegram / Discord /
     Slack / Feishu when you're away.
7. **Long-tail feature grid** — compact rows (icon + one line), linking to
   /use-cases or docs: Advanced Translation, Image Generation, AI Web Search,
   Writing Tools, Online Video Downloader, Live Camera, TTS / Read Aloud,
   Open Source, … (everything not already covered above).
8. **Testimonials** — keep existing component/content.
9. **Pricing** — two Pricing dimension groups, each three cards:
   - **"You bring the AI"**: Free / Lifetime Standard $49 / Lifetime Premium $99.
     Own-key usage always free and unlimited.
   - **"We bring the AI"**: Cloud Plus $10 / Pro $50 / Max $100 with a
     monthly ↔ annual toggle; Pro/Max note the Boost-model discounts.
   - Explicit note that the two dimensions **stack** (a Lifetime owner can add
     a Cloud plan). Teams card becomes a "Need team seats? Contact us" footnote.
10. **FAQs** — refresh copy to match new positioning and pricing model.
11. **Footer** — unchanged.

## Hero showcase spec

Auto-rotate through tabs in order; within a tab, sub-scenes advance in listed
order. Clicking a tab or chip jumps immediately and pauses auto-advance for a
grace period.

| # | Benefit label (tab) | Product name (in panel) | Sub-scenes |
|---|---|---|---|
| 1 | Works beside your apps | App Sidebar | ① Excel live edit ② Affinity ③ Attach per-app skills / MCPs |
| 2 | One glance away | Dynamic Island | ① Voice Command ② Live Screen ③ Doodle ④ Screenshot explain ⑤ App Shots |
| 3 | Fix any text instantly | PopBar | ① Fix Spelling ② Read Aloud ③ Translate |
| 4 | Speak, don't type | Voice / Dictation | ① Global dictation ② Live captions + meeting notes (speakers) ③ Live translation ④ Offline MLX / CoreML models |
| 5 | Your second brain | Knowledge Base | ① Drag a folder in, auto-sync ② Chat with your documents ③ Quick Capture ④ Voice Notes |
| 6 | Ask AI anywhere | SmartBar | ① Ask AI ② @ files & plugins ③ # references |
| 7 | Runs your Mac for you | Computer & Browser Use | ① Operate a native app end-to-end ② Complete a real web task |

24 sub-scene slots total.

### Asset plan (deferred recording)

- Structure ships first with **all 24 slots as placeholders**: a real product
  screenshot + one-line caption per sub-scene, framed in the Product
  Screenshot Panel style so a video later drops into the same frame.
- Clips: 10–20s each, real screen recordings (no mockups), muted autoplay
  loop, mp4/webm + poster image, lazy-loaded for non-active tabs.
- Recording is a joint later phase: shot scripts (operation, duration, zoom
  points) to be written per sub-scene, then recorded — with ScreenKite for the
  cursor-follow zoom treatment.

## Data & meta fixes riding along

- `src/data/features.tsx`: rename stale entries (Companion Orb → Pet;
  Context Awareness copy updated to current selected-text attach model; audit
  other renamed features), since the long-tail grid reuses this data.
- `index.tsx` Head + OG/Twitter meta: new title/description built on the
  Positioning line.

## Open items (decide during implementation)

- Final subtitle wording; FAQ rewrite content; testimonial curation; whether
  hero shows a social-proof line (user count / stars) under the CTA.
- Sub-scene shot scripts (written when recording starts).
