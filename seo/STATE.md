# SEO state — enconvo.com

Baseline numbers per page. Replace a row when it is re-measured and note the
date; the history lives in `LOG.md`.

## Data sources

| Source | Status (2026-09-24) |
| --- | --- |
| Google Search Console | **Readable** (domain property `sc-domain:enconvo.com`, via the owner's signed-in browser). Performance read; Page indexing report not read (the page did not load). |
| GA4 | Live site still sends to `G-X7999CT0H3`, a property in an account nobody can reach. Working tree now sends to the owner's property "enconvo.com" (477108245, `G-JBLMBKBEN2`), which has no data yet. **Not deployed.** `download_click` / `begin_checkout` are not key events yet; the GA4 events hub can only star an event after it has been received. There is no GA4 baseline; it starts on deploy day. |
| PostHog | Website is not instrumented (project data is app and webapp only). |
| Bing Webmaster Tools | Not connected. |
| PageSpeed Insights API | Daily quota exceeded on 2026-09-24; local Lighthouse used instead. No field (CrUX) data seen. |

## Search Console baseline

Domain property, web search, last 28 days (2026-08-25 to 2026-09-21), read
2026-09-24. This is the "before" for the heading change.

| Metric | Value |
| --- | ---: |
| Clicks | 113 |
| Impressions | 2,650 |
| CTR | 4.3% |
| Average position | 10.7 |
| Distinct queries | 89 |

Top queries:

| Query | Clicks | Impressions | CTR | Position |
| --- | ---: | ---: | ---: | ---: |
| enconvo | 73 | 241 | 30.3% | 3.2 |
| encovo | 5 | 94 | 5.3% | 3.2 |
| enconvo login | 1 | 81 | 1.2% | 6.6 |
| oneconvo | 0 | 28 | 0% | 2.4 |
| professional whisper integration services | 0 | 25 | 0% | 54.6 |
| econvo | 0 | 20 | 0% | 2.4 |
| custom whisper integration solutions | 0 | 20 | 0% | 75.9 |
| ai-powered launchers macos workflows | 0 | 7 | 0% | 1.7 |
| macos ai agent | 0 | 5 | 0% | 13.6 |
| mac os ai agent | 0 | 2 | 0% | 6.0 |

Reading: almost every click comes from the brand name or a misspelling of it.
Non-branded demand ("macos ai agent", "whisper integration") shows up only in
single-digit impressions or beyond position 10. This is the gap the heading
change targets.

Top pages:

| Page | Clicks | Impressions | CTR | Position |
| --- | ---: | ---: | ---: | ---: |
| `www.enconvo.com/` | 105 | 1,438 | 7.3% | 7.7 |
| `www.enconvo.com/changelog` | 0 | 709 | 0% | 8.4 |
| `www.enconvo.com/login` | 2 | 307 | 0.7% | 5.7 |
| `www.enconvo.com/use-cases` | 2 | 277 | 0.7% | 5.5 |
| `www.enconvo.com/cloud-pricing` | 0 | 118 | 0% | 7.0 |
| `docs.enconvo.com/changelog` | 1 | 341 | 0.3% | 7.9 |
| `docs.enconvo.com/docs/intro` | 1 | 295 | 0.3% | 4.2 |
| `docs.enconvo.com/docs/start` | 1 | 126 | 0.8% | 7.4 |
| `store.enconvo.com/` | 1 | 82 | 1.2% | 3.2 |

Impressions by host, summed over the 49 listed pages:

| Host | Pages | Clicks | Impressions |
| --- | ---: | ---: | ---: |
| `www.enconvo.com` | 9 | 109 | 2,917 |
| `docs.enconvo.com` | 12 | 3 | 850 |
| `store.enconvo.com` | 20 | 1 | 259 |
| `developer.enconvo.com` | 4 | 0 | 59 |

Page sums are larger than the property total because Search Console counts
each page separately.

## Homepage lab performance

Lighthouse 13.5.0, mobile simulated throttling, Edge headless, live
`https://www.enconvo.com/`, 2026-09-24. Local lab sample, not field data.

| Metric | Value |
| --- | ---: |
| Performance | 71 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| First Contentful Paint | 3.8 s |
| Largest Contentful Paint | 5.2 s |
| Total Blocking Time | 40 ms |
| Cumulative Layout Shift | 0 |
| Speed Index | 4.5 s |
| Total page weight | 4,141 KiB (mostly showcase video) |

## Search visibility (buying queries)

WebSearch tool, US results, 2026-09-24. Approximates Google; not a rank
tracker. Search Console confirms the picture: none of these queries appear in
its 89 queries.

| Query | enconvo.com position |
| --- | --- |
| AI assistant for Mac | not in results |
| best AI app for Mac 2026 | not in results |
| AI agent for Mac | **#7**, shown with an old title, "EnConvo - AI Agent Launcher for macOS" |
| Raycast AI alternative | not in results |
| ChatGPT desktop app alternative Mac | not in results |
| AI dictation app Mac | not in results |
| local LLM app Mac | not in results |

Third-party presence: absent from all 21 ranking listicles checked (details and
sources in `reports/2026-09-24-homepage-checkup.md`).

## Page inventory

State of the local working tree, 2026-09-24. Not deployed yet.

| Path | Indexable | In sitemap | Notes |
| --- | --- | --- | --- |
| `/` | yes | yes | Money page. Section headings rewritten (pending deploy). |
| `/use-cases` | yes | yes | |
| `/cloud-pricing` | yes | yes | Plan links now point to `/#pricing` (were a 404). |
| `/changelog` | yes | yes | 374 kB page data. 709 impressions, 0 clicks. |
| `/privacy` | yes | yes | |
| `/terms` | yes | yes | Refund paragraph now matches the 30-day guarantee. The "Pricing strategy" section is still outdated ("Basic/Pro version", "14-day free trial"). |
| `/downloads` | yes | no | |
| `/pricing` | — | no | 307 → `/#pricing` (was 404). |
| `/developer` | noindex | no | "Coming soon" placeholder. |
| `/mcp/install` | noindex | no | `enconvo://` deep-link handler. |
| `/okara` | — | no | Deleted; returns 404. |
| Account/auth/payment pages | noindex | no | Unchanged. |
| `docs.enconvo.com/*` | yes (live) | — | Old Docusaurus site. Redirect map to `docs.enconvo.ai` ready in `enconvo_docs/vercel.json`, not deployed. |
