# Homepage checkup — 2026-09-24

Money page: `https://www.enconvo.com/`. Four passes: crawl/index/speed,
competition, answer-engine readiness, conversion path. Ends with ONE
recommended change for approval.

**Data limits.** No Search Console, GA4 or Bing data was available, so nothing
here is based on real queries, impressions or conversions. Rankings come from a
search tool (US results), not a rank tracker. Reddit could not be searched.
These pages returned 403 and were not read: Product Hunt's alternatives page,
G2, SourceForge, AlternativeTo's Raycast page, topai.tools, toolify.ai and
creati.ai.

## 1. Crawl, index and speed

Fixed in this pass:

- `/pricing` returned 404 but was linked four times from `/cloud-pricing`, a
  commercial page. It now redirects (307) to `/#pricing`, and the four links
  point there directly.
- These pages were indexable and should not be: `/developer` ("Coming soon"),
  `/mcp/install` (an `enconvo://` deep-link handler with no title), and
  `/okara` (a replica of another company's website). All three now send
  `noindex, follow`.
- `llms.txt` linked to `https://docs.enconvo.com/`, an unedited Docusaurus
  template ("Hello from EnconvoAI", "Copyright © 2025 My Project, Inc."). It now
  links to the current docs, `https://docs.enconvo.ai/`.

Already fine:

- Sitemap (6 URLs), robots.txt, canonicals, and JSON-LD for Organization,
  WebSite, WebPage and SoftwareApplication.
- Server-rendered facts are visible to Googlebot, OAI-SearchBot and
  PerplexityBot (`scripts/check-homepage-discovery.mjs`).
- Lighthouse SEO scores 100.

Speed (lab, mobile): Performance 71, LCP 5.2 s, 4.1 MB page weight, mostly the
showcase video. No field data. Worth a later pass, but not the top lever while
the site barely appears for buying queries.

Open:

- `docs.enconvo.com` is still live and indexable. A redirect to
  `docs.enconvo.ai` needs a DNS/Vercel change by the owner.
- Search results still show the old title "EnConvo - AI Agent Launcher for
  macOS". A Search Console recrawl request would fix this faster.

## 2. Competition

Seven buying queries were checked. enconvo.com appeared once: #7 for "AI agent
for Mac".

| Query | Top results (source) |
| --- | --- |
| AI assistant for Mac | vellum.ai/blog/best-personal-ai-assistants-for-mac · simular.ai/simular-for-macos · cultofmac.com/reviews/best-ai-apps-for-mac · arahi.ai/blog/best-ai-assistant-for-mac · fluentmac.app |
| best AI app for Mac 2026 | timingapp.com/blog/best-ai-apps-for-mac · vellum.ai · arahi.ai · machow2.com/best-ai-apps-for-mac · yaps.ai/blog/best-ai-apps-mac |
| AI agent for Mac | simular.ai · sourceforge.net/directory/ai-agents/mac · blog.buildbetter.ai · github.com/macos26/agent · **www.enconvo.com (#7)** |
| Raycast AI alternative | producthunt.com/products/raycast/alternatives · g2.com · bestofai.io · wundertype.com · alternativeto.net |
| ChatGPT desktop app alternative Mac | setapp.com/lifestyle/chatgpt-alternatives · elephas.app/blog/best-chatgpt-alternatives · makeuseof.com · elvean.app/chatgpt-alternative-for-mac |
| AI dictation app Mac | willowvoice.com · tryvoiceink.com · spokenly.app · lumevoice.com |
| local LLM app Mac | docs.boltai.com/blog/run-llm-locally-on-mac · llmcheck.net/software · dev.to · modelfit.io |

What the winners do that the homepage does not:

- **Descriptive headings.**
  - Fluent's H1 is "AI Assistant That Works Inside Every Mac App", and an H2 is
    "Bring ChatGPT, Claude, Gemini and 500+ AI Models Into Any Mac App"
    (fluentmac.app).
  - Vellum and Arahi use question or topic H2s such as "What Is a Personal AI
    Assistant for Mac?" and "Privacy on Mac" (vellum.ai, arahi.ai).
  - Enconvo's four section H2s are slogans (see §3).
- **Comparisons and proof.** Simular has a "Comparing Simular AI to other AI
  agents for Mac" section and benchmark scores (simular.ai/simular-for-macos).
  Enconvo has no comparison content.
- **Privacy specifics.** Fluent lists what is stored and where
  (fluentmac.app). Enconvo gives one FAQ line.

Where Enconvo is already ahead: it names 15 providers, states exact prices and
system requirements, and says it is native, not Electron. Arahi has no FAQ, and
Simular starts at $50/month.

Third-party presence:

- Enconvo is in none of the 21 ranking listicles checked. Those lists feature
  direct competitors:
  - Raycast: 38 mentions on vellum.ai
  - BoltAI: 14 on timingapp.com, 19 on setapp.com
  - Msty: 8 on felloai.com
  - Wispr Flow: 66 on lumevoice.com
- Enconvo's own footprint is small:
  - One 2023 Product Hunt launch with 0 reviews
    (producthunt.com/products/enconvo).
  - One third-party YouTube video with 449 views
    (youtube.com/watch?v=WpExuDD0Nso).
  - Several directories list outdated facts: macaiapps.com says macOS 13 and
    "$10 / $96/year"; bestaiagents.ai says "Voice AI Agent Builder, from
    $10/month".
- An unrelated UK telecom brand is also named "Enconvo"
  (enreach.com/en/our-labels/enconvo).

## 3. Answer-engine readiness

- **Headings.** The H1 "The assistant your Mac was promised." contains "Mac" and
  "assistant" but not the category phrase. The section H2s say nothing about
  what the section covers:

  | Current H2 | What the section actually covers |
  | --- | --- |
  | Any AI. Your terms. | OpenAI, Anthropic, Gemini, local MLX/Ollama/LM Studio, existing ChatGPT/Claude/Grok subscriptions |
  | A platform, not a chatbox. | MCP servers, 80+ plugins, skills, workflows |
  | On your desktop. In your pocket. | Desktop pet status companion; messaging the agent from Telegram, Discord, Slack, Feishu |
  | The rest of the toolbox. | Agent mode, writing tools, web search, image generation, translation, live screen, offline mode |

- **Answers.** The FAQ answers are short and standalone. Good.
- **Consistency.** These contradict each other, and answer engines quote
  whichever one they find:
  - Refund policy has three versions:
    - Pricing cards: "30-day money back guarantee" (`src/components/Pricing.tsx`).
    - FAQ: "14-day no-questions-asked refund policy for Lifetime Licenses"
      (`src/components/Faqs.tsx`).
    - Terms: tells users to ask Apple support (`src/pages/terms.tsx`).
  - Name spelling: the header wordmark and footer say "EnConvo"; the title,
    FAQ and structured data say "Enconvo".
- `llms.txt` and schema are in place. By themselves they are not an AEO lever.

## 4. Conversion path

- There were no named conversion events. Added `download_click` (hero download
  menu) and `begin_checkout` (all license and Cloud plan CTAs). Both were
  verified in a browser with the expected parameters.
- The hero has one clear primary CTA ("Download for macOS"). Good.
- The site nav has no Download button, and `/use-cases` and `/changelog` do not
  link to the download menu. Visitors landing there have no early next step.
- Clicking a plan CTA while signed out goes to login and then back to checkout.
  Unchanged and verified.

## Ranked fixes

1. **Owner decisions (hygiene, not experiments):**
   - Pick one refund policy.
   - Pick one spelling of the name.
   - Delete or keep `/okara`.
   - Redirect `docs.enconvo.com`.
2. **Connect data:**
   - Search Console for enconvo.com, including a recrawl request.
   - Read access to GA4.
   - Mark both events as key events.
3. **The ONE on-page change** (below).
4. **Off-site:**
   - Pitch the ranking listicles that already cover BoltAI, Elephas or Raycast
     (timingapp.com, machow2.com, setapp.com, felloai.com, vellum.ai, yaps.ai).
   - Ask directories to correct outdated facts.
   - Plan a Product Hunt relaunch.
5. **Later:** a nav Download CTA, comparison pages (e.g. Raycast AI or ChatGPT
   desktop alternatives), and trimming LCP and page weight.

## ONE recommended change (awaiting approval)

Replace the four slogan H2s with descriptive headings. Move each slogan into
the small kicker line above the H2 (replacing labels like "Model freedom"), so
the brand voice stays and only the heading text changes. Copy only restates what each section already says.

| Section (current kicker) | New kicker (was H2) | New H2 |
| --- | --- | --- |
| Model freedom | Any AI. Your terms. | Use OpenAI, Anthropic, Gemini or local models in one Mac app |
| Open & extensible | A platform, not a chatbox. | Extend your Mac AI agent with MCP servers, plugins, skills and workflows |
| Always with you | On your desktop. In your pocket. | Track your agents on the desktop and command your Mac from Telegram, Discord or Slack |
| And more | The rest of the toolbox. | 100+ built-in AI tools for writing, web search, translation and screen context |

Why this change:

- It targets the queries where Enconvo is missing ("AI assistant for Mac",
  "Raycast AI alternative", "local LLM app Mac") with words the ranking pages
  use.
- It touches only the money page and does not alter layout or CTAs.

How to judge it (needs step 2 first):

- Search Console impressions and average position for those queries.
- `download_click` per homepage session, four weeks before and after.

Revert if downloads per session drop.

## Status update (later on 2026-09-24)

The owner approved every recommendation. The report above is kept as
written; the current state is:

| Item | Status |
| --- | --- |
| ONE change: descriptive H2s | Implemented as proposed in the table above. Verified on a local production build. **Not deployed.** |
| Refund policy | FAQ and Terms now state the 30-day license guarantee that the backend enforces. The Terms "Pricing strategy" section is still outdated. |
| Name spelling | "Enconvo" in all site text except customer quotes and historical release notes. |
| `/okara` | Deleted (404). |
| `docs.enconvo.com` | Redirect map ready in `enconvo_docs/vercel.json`. Not deployed. |
| Search Console | Connected (read). Baseline in `STATE.md`. It confirms the data-limits note above: non-branded visibility is near zero. |
| Recrawl request | Waiting on deploy. |
| GA4 | Site tag switched to the owner's property 477108245 (`G-JBLMBKBEN2`); the old `G-X7999CT0H3` property is in an account nobody can reach. Star both events as key events once they arrive after deploy. |
| Off-site | Drafts in `../outreach.md`. Not sent. |

How to judge the change is unchanged. Starting four weeks after deploy,
compare Search Console impressions and position for non-branded Mac AI
queries, and `download_click` per homepage session, against `STATE.md`.
