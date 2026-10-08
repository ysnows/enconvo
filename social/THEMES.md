# Enconvo social themes

v0 draft, 2026-09-29. `remind.sh` reads this file every day: the weekly
table sets the day's pillar, and the topic bank supplies suggestions when
`queue/<date>.md` has no drafts. When a topic is used, change `- [ ]` to
`- [x]` and append the date.

Posts are in English (the main audience is US and Europe). X is the main
channel. The Facebook Page reuses the X post. Reddit gets comments every
day and at most one post a week.

## Weekly rhythm

| Day | Weekday | Pillar | What to post | Main platforms |
|---|---|---|---|---|
| 1 | Mon | Demo | One feature, one task: a 20–40 s screen recording that shows the result | X video, FB Page |
| 2 | Tue | Use case | A real workflow for one kind of person (developer, writer, meetings, research) | X, Reddit comments |
| 3 | Wed | Build in public | Behind the scenes: a decision, a bug, a number, a lesson | X thread, FB Page |
| 4 | Thu | Take / compare | An honest opinion or comparison (vs ChatGPT desktop, Raycast AI, dictation apps) | X, Reddit comments |
| 5 | Fri | Ship | What shipped this week, taken from the newest changelog | X, FB Page, Ken Moo (per release) |
| 6 | Sat | Tip | One small tip with a screenshot or GIF | X, FB Page |
| 7 | Sun | Ask | A question or poll for the audience, or a user showcase | X poll, FB Page |

## Topic bank

### 1 · Demo

- [ ] Select text in any app → one hotkey → rewritten in place (Inline Mode). No copy-paste, no chat window.
- [ ] Speak a command, watch it run: the Voice Command HUD in the notch area (Dynamic Island).
- [ ] Dictation that runs on your Mac's Neural Engine (CoreML Parakeet): offline, fast, small download.
- [ ] App Sidebar reads the page you're on: ask a question about an article or PDF without leaving it.
- [ ] Meeting recording that knows who spoke, with word-by-word playback and live translated captions.
- [ ] Screenshot + Screen Doodle → circle something → ask about it.
- [ ] "Summarize today's unread email" through the Gmail Connector (beta).
- [ ] Your AI agent builds a workflow for you in the visual editor, then runs it step by step.
- [ ] Drop a folder into a Knowledge Base and ask for exact names, codes and numbers.
- [ ] Browser Operator fast mode finishes a multi-step web task by itself (beta).
- [ ] A desktop Avatar that talks back with lip sync: Puppy, Bear, Cat (beta).
- [ ] Start a chat on the Mac, continue it on iPhone. It still runs on your Mac (beta).

### 2 · Use case

- [ ] Non-native English speaker: fix every email and Slack message in place, in the app you're already in.
- [ ] Developer: run local MLX models on Apple Silicon and use them in Claude Code, through Enconvo.
- [ ] Meeting-heavy PM: record → speakers → summary → action items, all local.
- [ ] Researcher: a Knowledge Base over 200 PDFs that cites exact passages.
- [ ] Privacy-first setup: local models + on-device dictation, nothing leaves the Mac.
- [ ] Language learner: live captions with translation on any video or call.
- [ ] Inbox triage in the morning: the Gmail Connector + an agent that drafts replies.
- [ ] Writer: voice-dictate a draft, then polish it with one hotkey.

### 3 · Build in public

- [ ] Why Enconvo lets you use the ChatGPT or Claude subscription you already pay for instead of reselling tokens.
- [ ] How we made agent runs faster and cheaper by running independent steps together (with before/after numbers).
- [ ] Why every chat now shows what it costs (the points pill), and why we cap runaway agent runs.
- [ ] The Mac app moved to a new signing team: what broke (permissions) and what we learned.
- [ ] Building Pixar-style Avatars with lip sync that run on both the Mac and iPhone.
- [ ] How a native Swift app talks to 80+ Node.js extensions over one Unix socket.
- [ ] A week of indie dev: what shipped, what broke, what's next.
- [ ] The first-launch guide got cut to 4 steps. Here's what we removed and why.

### 4 · Take / compare

- [ ] ChatGPT desktop is a chat window. Enconvo works inside every app. Here's the difference in 30 seconds.
- [ ] Raycast AI vs Enconvo: bring your own ChatGPT/Claude subscription vs paying for another one.
- [ ] Dictation apps vs Enconvo: why dictation + agent in one app beats two subscriptions.
- [ ] Stop paying for 5 AI subscriptions. One Mac app, the models you already have.
- [ ] Local vs cloud models on Apple Silicon in 2026: what actually works day to day.
- [ ] Why we still sell a one-time $49 license in the age of subscriptions.

### 5 · Ship

- [ ] Weekly recap: 3 things that shipped this week + 1 thing that broke (material: newest `changelogs/` file, shown in Friday's reminder).
- [ ] 2.5.6 production launch week: Product Hunt + Show HN + r/macapps in the same week.

### 6 · Tip

- [ ] Right Shift saves what you're looking at to Quick Memory.
- [ ] Switch the default agent from the agent icon in SmartBar.
- [ ] Use your Claude or ChatGPT subscription as the model provider (Settings → Providers).
- [ ] Give your most-used command its own hotkey.
- [ ] Projects keep chats, files and shared instructions for one piece of work together.
- [ ] Hover a chat's points pill to see exactly what it cost.

### 7 · Ask

- [ ] What's the one Mac app you wish had AI built in?
- [ ] Poll: how many AI subscriptions do you pay for? 0 / 1 / 2–3 / 4+
- [ ] Do you dictate your prompts or type them?
- [ ] Local models or cloud — which do you actually use every day?
- [ ] What's the most annoying copy-paste loop in your day?

## Reddit: weekly post rotation

One post a week, rotating, following each subreddit's self-promotion rules.
Always disclose "I'm the developer". Comment every day in the others.

1. r/macapps: release or feature post
2. r/ClaudeAI: use your Claude subscription in every Mac app
3. r/LocalLLaMA: local MLX models on the Mac (lead with the technical detail, not the product)
4. r/productivity: a workflow write-up (use case pillar)
5. r/SideProject: build-in-public story
6. r/ChatGPT: ChatGPT subscription inside every app

## Ken Moo community

Per release, not daily. Pending: the partnership shape (deal, affiliate, review).
