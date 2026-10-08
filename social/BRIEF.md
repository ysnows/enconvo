# Social brief — Enconvo

Daily posting on X, Reddit, the Facebook Page and groups, and the Ken Moo
community. Themes and topics: `THEMES.md`. Drafts: `queue/<date>.md`.
Posted log: `LOG.md`. The reminder `remind.sh` runs every day at 19:27
(Beijing) through Enconvo Cron and is sent to Telegram.

## Positioning (one line)

The AI that works inside every Mac app — with the ChatGPT or Claude
subscription you already have.

## Voice

- First person, indie founder. Concrete and short. One idea per post.
- Show, don't tell: every X post has a clip, GIF or screenshot.
- No "revolutionary", "game-changer", "unleash", or emoji walls.
- Beta features are labeled "(in beta)".
- Chinese users are secondary; posts are in English.

## Platform rules

- **X**: 1 post a day plus 5–10 replies to relevant posts. Put the link in
  the first reply, not in the post.
- **Reddit**: 3–5 helpful comments a day from a personal account with
  history. At most 1 post a week (rotation in `THEMES.md`). Always
  disclose "I'm the developer". About 9 helpful contributions per mention.
- **Facebook**: the Page reuses the X post every day (schedule it in Meta
  Business Suite). Groups: 1–2 posts a week, only where promotion is
  allowed. The Groups API is gone, so group posts are manual.
- **Ken Moo community**: per release, after the partnership is agreed.

## Timing

US morning, 8–10 am Eastern = 20:00–22:00 Beijing (21:00–23:00 after
US daylight saving ends on 2026-11-01).

## Attribution

Links carry UTM tags, one source per platform:

- X: `https://enconvo.com/?utm_source=x&utm_medium=social&utm_campaign=daily`
- Reddit: `utm_source=reddit`
- Facebook: `utm_source=facebook`
- Ken Moo: `utm_source=kenmoo`

Check `download_click` by source in GA4 during the Thursday SEO review.
One trial-code batch per channel when a channel gets an offer.

## Workflow

1. Sunday: Claude writes next week's 7 drafts into `queue/`.
2. Monday: schedule the X and Facebook Page posts for the week.
3. Every day at 19:27: the reminder arrives on Telegram with today's
   pillar and drafts. Post, reply, comment (about 15 minutes).
4. Log each post in `LOG.md` (or tell Claude the links).
