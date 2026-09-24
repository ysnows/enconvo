# SEO brief — enconvo.com

Read this before every SEO pass. Update it only when the business changes.

## Business

Enconvo is a native macOS AI assistant and agent (macOS 14+, Intel and Apple
Silicon). It works across the user's apps with screen and selected-text context,
and covers writing, research, app automation, dictation, meeting notes and
document search.

## Offer

- **Free download.** Every core feature, unlimited when the user brings an API
  key, signs in with an existing ChatGPT / Claude / Grok subscription, or runs
  local models (MLX, Ollama, LM Studio).
- **License (one-time).** Removes creation caps (knowledge bases, workflows).
  Standard, Premium and Teams (per seat).
- **Enconvo Cloud (subscription).** Plus, Pro and Max, monthly or annual, with
  points for hosted models and no key setup. Rates on `/cloud-pricing`.

## Buyer

Mac power users who already pay for or try several AI tools (ChatGPT desktop,
Raycast AI, BoltAI, Elephas, Msty, Superwhisper, Wispr Flow) and want one native
app that uses any model, works inside other apps, and can stay local.

## Conversions

Success is measured by conversions, not traffic.

| Event (GA4) | Fires when | Key params |
| --- | --- | --- |
| `download_click` | Hero "Download for macOS" menu item (arm64 or x64) | `arch` (`arm64`, `x64`), `placement` (`hero`), `page_path` |
| `begin_checkout` | Any license or Cloud plan CTA in the homepage pricing section | `plan` (lookup key, e.g. `standard`, `premium`, `teams`, `monthly`, `pro_yearly`), `signed_in`, `page_path` |

The pricing code also sends `download_click` with `placement: pricing_free`
from its Free branch, but no homepage button uses that branch today.

Both events must be marked as **key events** before they show up in conversion
reports. Use GA4 property "enconvo.com" (477108245, web stream `G-JBLMBKBEN2`,
the ID in `src/pages/_app.tsx`). Go to Admin → Data display → Events → Recent
events and click the star next to each event. An event appears there only after
it has been received, so star them after the first production hits. The site
sent to `G-X7999CT0H3` until 2026-09-24; that property is in an account nobody
can reach.

## Money page

The homepage (`/`). It is the only page with both the download menu and the
checkout buttons, and it is the page that ranks (see `STATE.md`). Revisit this
choice once four weeks of Search Console and GA4 data exist.

## Rules for every pass

1. One change at a time. Recommend it, wait for approval, then publish.
2. Every competitor claim carries its source URL. Missing data is written down
   as missing, never guessed.
3. Record the baseline in `STATE.md` before a change and the result after it.
4. Append to `LOG.md`; never rewrite old entries.

## Weekly routine

Every Thursday, one pass, about 30 minutes:

1. **Measure.** In Search Console (`sc-domain:enconvo.com`, last 28 days), read
   totals, top queries and top pages. In GA4, read `download_click` and
   `begin_checkout` per homepage session. Compare with `STATE.md`.
2. **Judge the live change.** Wait four weeks after a change before calling
   it. Keep it, revert it, or extend the wait. Write the verdict in `LOG.md`.
3. **Check hygiene.** Look at Page indexing errors, sitemap status and whether
   `/pricing` and `docs.enconvo.com` still redirect.
4. **Recommend one next change.** Write it with its source URLs and wait for
   approval.
5. **Off-site.** Follow up on `outreach.md` items that have been sent.
6. **Record.** Replace the measured rows in `STATE.md` and append to `LOG.md`.

