export interface UseCase {
  /** Stable anchor id — /use-cases#<slug> deep-links to this entry */
  slug: string
  title: string
  description: string
  youtubeId: string
  category: string
  /**
   * Set on a version's update video, as major.minor.patch ("2.5.14"). The app reads it
   * from /api/tutorials: after updating to that version it offers this video once, and
   * Settings > Tutorials shows it first.
   */
  version?: string
  /** YouTube publish date, YYYY-MM-DD. Entries sort newest-first by default. */
  date: string
  /** Optional "Read the guide" link into docs.enconvo.ai */
  docsUrl?: string
}

export const useCases: UseCase[] = [
  {
    slug: 'dictation-send-pause-mute-step-by-step',
    title: 'Dictation that sends, pauses and mutes, step by step',
    description:
      'Press Return to stop, insert and send in one go, pause and resume with a key, let Dictation mute your meeting microphone while you talk, slim the bar down, and answer a message with a Draft, a narrated walkthrough in under three minutes.',
    youtubeId: 'ZUe2Brzk5zA',
    category: 'Tutorials',
    date: '2026-11-13',
    docsUrl: 'https://docs.enconvo.ai/features/dictation',
  },
  {
    slug: 'whats-new-2-5-15-more-touches',
    title: 'What else is new in Enconvo 2.5.15',
    description:
      'The smaller additions in 2.5.15: update videos and walkthroughs that play in Settings, code blocks that wrap long lines, Claude Code chats that skip approval prompts at Full access, and an Ultracode switch, a narrated tour in just over a minute.',
    youtubeId: 'N_irURJ-fvQ',
    category: 'Tutorials',
    date: '2026-11-13',
    docsUrl: 'https://docs.enconvo.ai/changelog',
  },
  {
    slug: 'smart-bar-calculator-step-by-step',
    title: 'Smart Bar and Dynamic Island answers, step by step',
    description:
      'Type a sum, a conversion or a time on the Dynamic Island’s Home and see the answer right under the island, then ask the Smart Bar for the weather, a flight or the time anywhere, a narrated walkthrough in under a minute and a half.',
    youtubeId: 'Q1Z8p-hVBsE',
    category: 'Tutorials',
    date: '2026-11-13',
    docsUrl: 'https://docs.enconvo.ai/features/smartbar',
  },
  {
    slug: 'live-captioning-and-languages-step-by-step',
    title: 'Live Captioning and new languages, step by step',
    description:
      'Put live captions at the left, right, top or bottom of your screen, resize them, move them mid-session, start and stop them with a hotkey, translate into any language the speech engine supports, and switch Enconvo to Ukrainian or Russian, a narrated walkthrough in under two minutes.',
    youtubeId: 'QQHTU4Ch8o0',
    category: 'Tutorials',
    date: '2026-11-13',
    docsUrl: 'https://docs.enconvo.ai/features/live-captioning',
  },
  {
    slug: 'model-recommendations-step-by-step',
    title: 'Model recommendations and agent avatars, step by step',
    description:
      'See the best fit, lowest cost and best quality model for each job with prices, get a warning before a far pricier pick, browse Cloud models by vendor, and let New Agent suggest a model and draw four avatars in your style, a narrated walkthrough in under two minutes.',
    youtubeId: '94A2bxzXoDQ',
    category: 'Tutorials',
    date: '2026-11-13',
    docsUrl: 'https://docs.enconvo.ai/ai/model-selection-guide',
  },
  {
    slug: 'parallel-chats-and-worktrees-step-by-step',
    title: 'Parallel chats and worktrees, step by step',
    description:
      'Let the agent open a parallel chat for a separate job, work in a Project worktree, commit and merge back to the main checkout, and move a chat into a new worktree with its uncommitted changes, a narrated walkthrough in under two minutes.',
    youtubeId: 'JBcZxH2Lrqc',
    category: 'Tutorials',
    date: '2026-11-13',
    docsUrl: 'https://docs.enconvo.ai/ai/projects',
  },
  {
    slug: 'temporary-and-active-chats-step-by-step',
    title: 'Temporary chat and Active chats, step by step',
    description:
      'Ask a one-off question in a Temporary chat that leaves no history, find every running or waiting chat in the Active group, and add to a task while the agent works, with unrelated asks going to a subagent, a narrated walkthrough in about a minute and a half.',
    youtubeId: '2OgsFIXlMWs',
    category: 'Tutorials',
    date: '2026-11-13',
    docsUrl: 'https://docs.enconvo.ai/ai/chat',
  },
  {
    slug: 'recording-summaries-step-by-step',
    title: 'Recording summaries, step by step',
    description:
      'Get a meeting summary the way you want it: figures, a timeline and Talk time, built-in templates and one you write in plain words, tasks sent to Action items, any output language and translated notes, a narrated walkthrough in about two and a half minutes.',
    youtubeId: 'fkVUNP0vtLU',
    category: 'Tutorials',
    date: '2026-11-13',
    docsUrl: 'https://docs.enconvo.ai/features/meeting-recording',
  },
  {
    slug: 'whats-new-2-5-13',
    title: 'What’s new in Enconvo 2.5.13',
    description:
      'Every headline of 2.5.13 in one narrated tour: Spaces you build by asking, Workspaces that keep each job apart, Projects with a Board that follows every task to Done, App Sidebar beside any app, your other computers and SSH hosts, and Dictation that drafts and translates — about eleven minutes, with a chapter for each.',
    youtubeId: 'viSojOLdGBU',
    category: 'Tutorials',
    version: '2.5.13',
    date: '2026-11-11',
    docsUrl: 'https://docs.enconvo.ai/changelog',
  },
  {
    slug: 'app-sidebar-step-by-step',
    title: 'App Sidebar, step by step',
    description:
      'Press Control-Command-E and an assistant docks beside the app you’re in, already knowing what’s there: a YouTube video’s captions and chapters, starters made for the site, times in the answer that jump the video, and smaller copies of the photos you selected in Finder — a narrated walkthrough in under a minute and a half.',
    youtubeId: 'DDR8eET_xBA',
    category: 'Tutorials',
    date: '2026-11-11',
    docsUrl: 'https://docs.enconvo.ai/features/app-sidebar',
  },
  {
    slug: 'dictation-drafts-and-translation-step-by-step',
    title: 'Dictation drafts and translation, step by step',
    description:
      'Say what you want and Dictation writes it: an email reply drafted from a spoken instruction that even picks up details from the message, then Chinese spoken and English typed, with a Translation Style of Standard, Sound Native or Custom — a narrated walkthrough in under two and a half minutes.',
    youtubeId: 'x4A7B9kIVYs',
    category: 'Tutorials',
    date: '2026-11-11',
    docsUrl: 'https://docs.enconvo.ai/features/dictation',
  },
  {
    slug: 'whats-new-2-5-13-more-touches',
    title: 'What else is new in Enconvo 2.5.13',
    description:
      'The smaller additions in 2.5.13: Claude Fable 5.2 in the model menu, Antigravity, Grok Build and Muse Code as Coding agents, a Link, CLI and API row on every agent, Artifacts in Desktop Sync, and new Contrast and Chat Width settings — a narrated tour in just over a minute.',
    youtubeId: '87x1INCsdIE',
    category: 'Tutorials',
    date: '2026-11-11',
    docsUrl: 'https://docs.enconvo.ai/changelog',
  },
  {
    slug: 'computers-and-ssh-hosts-step-by-step',
    title: 'Computers and SSH Hosts, step by step',
    description:
      'Let the Agent work on your other machines: add a server from your SSH config, mention it in a chat, and ask about it the way you would about your Mac, with every command it ran one click away and one switch to stop all access — a narrated walkthrough in under a minute and a half.',
    youtubeId: 'ojtTTtqTod4',
    category: 'Tutorials',
    date: '2026-11-11',
    docsUrl: 'https://docs.enconvo.ai/integrations/computers-and-ssh-hosts',
  },
  {
    slug: 'projects-and-board-step-by-step',
    title: 'Projects and the Board, step by step',
    description:
      'Give every task a card that follows it to Done: a Project’s Chat, Board and Team & settings tabs, a new idea handed to Claude Code, one Board for every Project under Memory, and archiving a Project without losing anything — a narrated walkthrough in under two minutes.',
    youtubeId: 'sDHMeGn6iX0',
    category: 'Tutorials',
    date: '2026-11-11',
    docsUrl: 'https://docs.enconvo.ai/ai/projects',
  },
  {
    slug: 'workspaces-step-by-step',
    title: 'Workspaces, step by step',
    description:
      'Keep each client or job apart: create a Workspace with its own chats, Memory, knowledge and sign-ins, switch from the top of the sidebar or with Control-Command and a number, and manage them all in Settings — a narrated walkthrough in about a minute.',
    youtubeId: 'fMHIhDRufXA',
    category: 'Tutorials',
    date: '2026-11-11',
    docsUrl: 'https://docs.enconvo.ai/configuration/account#workspaces',
  },
  {
    slug: 'spaces-step-by-step',
    title: 'Spaces, step by step',
    description:
      'Ask the Agent for a page of your own and it builds it: a subscriptions tracker with renewal dates and a monthly total that sits in your sidebar, changes when you ask, and can live in the Dock or the menu bar — a narrated walkthrough in under a minute and a half.',
    youtubeId: 'fdIh8UtRsuo',
    category: 'Tutorials',
    date: '2026-11-11',
    docsUrl: 'https://docs.enconvo.ai/features/spaces',
  },
  {
    slug: 'avatars-channels-credentials-step-by-step',
    title: 'Avatars, IM Channels and Credentials, step by step',
    description:
      'Bring your agents closer: give an agent a character on your desktop with lip sync, reach it from Telegram with only the people you approve, and keep every key and sign-in in one place, where you can see which features use each one — a narrated walkthrough in just over a minute.',
    youtubeId: 'O5rNJwqlisg',
    category: 'Tutorials',
    date: '2026-11-09',
    docsUrl: 'https://docs.enconvo.ai/integrations/messaging',
  },
  {
    slug: 'apis-cli-hooks-step-by-step',
    title: 'APIs, CLI and Hooks, step by step',
    description:
      'For developers, everything in Enconvo is also an API: every installed extension serves HTTP endpoints on your Mac, the command line tool comes with the app, and hooks run your own scripts at set points in an agent’s work — a narrated walkthrough in under a minute.',
    youtubeId: '52s8NEIzxDo',
    category: 'Tutorials',
    date: '2026-11-09',
    docsUrl: 'https://docs.enconvo.ai/advanced/cli-local-api',
  },
  {
    slug: 'enconvo-on-your-mac-step-by-step',
    title: 'Set up Enconvo on your Mac, step by step',
    description:
      'Make Enconvo fit the way you work: change every hotkey in one place, choose what SmartBar picks up from the app you’re in, add the window in front of you with Appshots, see which AI runs locally and offline, check macOS permissions, and keep your Mac awake so your iPhone can reach it — a narrated walkthrough in under a minute and a half.',
    youtubeId: 'KLluTyxxd7s',
    category: 'Tutorials',
    date: '2026-11-09',
    docsUrl: 'https://docs.enconvo.ai/configuration/keyboard-shortcuts',
  },
  {
    slug: 'automations-step-by-step',
    title: 'Automations and Workflows, step by step',
    description:
      'Let routine work run by itself: automations run an agent, a workflow or a command on a schedule, when something happens, or when you start them; workflows chain steps into a job you can run again; variables put live context into prompts; and quiet hours decide when you hear about the results — a narrated walkthrough in under a minute.',
    youtubeId: 'XLbDK5J3fjE',
    category: 'Tutorials',
    date: '2026-11-09',
    docsUrl: 'https://docs.enconvo.ai/workflows/scheduled-jobs',
  },
  {
    slug: 'skills-and-plugins-step-by-step',
    title: 'Skills, MCP and Plugins, step by step',
    description:
      'Give your agents new abilities: skills that teach every agent a job, MCP servers that connect outside tools and data, plugins like Notion, Slack and GitHub, and an Extension Store with more than a hundred extensions — a narrated walkthrough in under a minute and a half.',
    youtubeId: 'eZeUgu54kQw',
    category: 'Tutorials',
    date: '2026-11-09',
    docsUrl: 'https://docs.enconvo.ai/configuration/skills',
  },
  {
    slug: 'memory-step-by-step',
    title: 'Memory and the Knowledge Base, step by step',
    description:
      'See what your agents can draw on, how they learn from your chats with Undo for everything, tell them about yourself in About You, keep your documents in a Knowledge Base, and save the app in front of you with Quick Capture — a narrated walkthrough in under a minute and a half.',
    youtubeId: 'zvr6DJaZuJo',
    category: 'Tutorials',
    date: '2026-11-09',
    docsUrl: 'https://docs.enconvo.ai/ai/memory',
  },
  {
    slug: 'video-conference-step-by-step',
    title: 'Meetings, recordings and voice notes, step by step',
    description:
      'Start or schedule a Video Conference with captions you can translate and notes that write themselves, record a meeting in any other app, transcribe a file, follow live captions, and save a voice note with one hotkey — a narrated walkthrough in about a minute and a half.',
    youtubeId: 'X0uBfcS3h5g',
    category: 'Tutorials',
    date: '2026-11-09',
    docsUrl: 'https://docs.enconvo.ai/features/video-conference',
  },
  {
    slug: 'teams-and-workspaces-step-by-step',
    title: 'Set up your account, team and Workspaces, step by step',
    description:
      'See your points, your lifetime licence and your Cloud plan, give your team Seats and shared points while their chats stay private, keep each client’s work in its own Workspace, and sync everything across your computers — a narrated walkthrough in about a minute and a half.',
    youtubeId: 'FnddgYQfcTc',
    category: 'Tutorials',
    date: '2026-11-09',
    docsUrl: 'https://docs.enconvo.ai/configuration/account',
  },
  {
    slug: 'agent-orchestrator-step-by-step',
    title: 'Let a team of Agents do the work, step by step',
    description:
      'Name Agents with @ in any chat: the lead writes a Work plan with a goal and one task for each Agent, and the Board shows every task from start to done. Then make a Project for bigger work, with coding agents that each work in their own copy of the code — a narrated walkthrough in under two minutes.',
    youtubeId: 'i4gkxo4NJr4',
    category: 'Tutorials',
    date: '2026-11-09',
    docsUrl: 'https://docs.enconvo.ai/ai/agent-orchestrator',
  },
  {
    slug: 'agents-step-by-step',
    title: 'Meet the Agents and make your own, step by step',
    description:
      'See the Agents behind every answer: Mavis, the built-in Agents made for one job each, and the coding agents you may already use. Open one to see its instructions, model, skills, knowledge, memory and voice, then make your own — a narrated walkthrough in under two minutes.',
    youtubeId: 'X0e_atQEQ0I',
    category: 'Tutorials',
    date: '2026-11-09',
    docsUrl: 'https://docs.enconvo.ai/ai/agents',
  },
  {
    slug: 'chat-window-step-by-step',
    title: 'Get around the Chat Window, step by step',
    description:
      'Choose which Agent answers, switch the model or the permissions for one chat, add files, and pick what you want to make. Then ask, follow up in the same chat, and find any chat again — a narrated walkthrough in two minutes.',
    youtubeId: 'qfFG0nwxc6s',
    category: 'Tutorials',
    date: '2026-11-09',
    docsUrl: 'https://docs.enconvo.ai/ai/chat',
  },
  {
    slug: 'ai-models-step-by-step',
    title: 'Choose your AI model: your plan, your keys or your Mac, step by step',
    description:
      'Use the Cloud plan with no keys, sign in with the ChatGPT, Claude, GitHub Copilot, Antigravity or Grok plan you already pay for, paste your own API key, or run models right on your Mac. Then make your pick the default — a narrated walkthrough in two minutes.',
    youtubeId: '_mRULjM5ZKw',
    category: 'Tutorials',
    date: '2026-11-09',
    docsUrl: 'https://docs.enconvo.ai/providers/overview',
  },
  {
    slug: 'computer-use-step-by-step',
    title: 'Let your Mac click, type and browse for you, step by step',
    description:
      'Turn on Computer Use, give it Accessibility and Screen Recording, and add the browser extension to Chrome. Then hold the right Option key and ask: it works in Safari, right inside your browser, in your Mac’s own apps, and even on a whole task — a narrated walkthrough in seven steps.',
    youtubeId: '0CbQA7d8zqU',
    category: 'Tutorials',
    date: '2026-10-25',
    docsUrl: 'https://docs.enconvo.ai/features/computer-use',
  },
  {
    slug: 'dictation-step-by-step',
    title: 'Type with your voice in any app, step by step',
    description:
      'Hold or tap the right Command key, talk, and your words are typed wherever you’re writing. Let it read names off your screen, teach it a name, polish or translate what you said, and pick the speech model — even one that runs on your Mac — a narrated walkthrough in seven steps.',
    youtubeId: 'wqYet4Kdono',
    category: 'Tutorials',
    date: '2026-10-24',
    docsUrl: 'https://docs.enconvo.ai/features/dictation',
  },
  {
    slug: 'ai-commands-step-by-step',
    title: 'Make your own AI command, step by step',
    description:
      'Turn a prompt you use all the time into a command of its own. Describe what it should do, try it on your own text, change it in your own words, add it to PopBar and give it a hotkey, then run it on your notes in any app — a narrated walkthrough in six steps.',
    youtubeId: 'zRD7Yg_Grjw',
    category: 'Tutorials',
    date: '2026-10-24',
    docsUrl: 'https://docs.enconvo.ai/features/ai-commands',
  },
  {
    slug: 'popbar-step-by-step',
    title: 'Set up PopBar and use it every day, step by step',
    description:
      'Select text in any app and PopBar pops up above it with one-click actions. Turn it on, choose when it shows, fix, translate and ask AI, let fixes land inline, arrange your buttons, make your own AI command and add extensions — a narrated walkthrough in nine steps.',
    youtubeId: 'CRlQt5UFrG4',
    category: 'Tutorials',
    date: '2026-10-18',
    docsUrl: 'https://docs.enconvo.ai/features/popbar',
  },
  {
    slug: 'ai-companion-mac-iphone',
    title: 'Meet Enconvo Live Avatar',
    description:
      'Talk to an expressive AI avatar, ask it to move or dance, then watch it check the weather and book a restaurant through your browser.',
    youtubeId: 'heiBOqK6KGU',
    category: 'AI Agent',
    date: '2026-10-10',
  },
  {
    slug: 'pair-your-iphone',
    title: 'Pair your iPhone and reach your Mac from anywhere',
    description:
      'Sign in on the Enconvo iPhone app, show the pairing code on your Mac, and scan it. Your Mac’s projects and chats are then on your phone, and every chat keeps running on your Mac — a narrated walkthrough in seven steps.',
    youtubeId: 'rYhgz_SjnNs',
    category: 'Tutorials',
    date: '2026-09-27',
    docsUrl: 'https://docs.enconvo.ai/integrations/iphone-app',
  },
  {
    slug: 'build-your-first-workflow',
    title: 'Build your first workflow, step by step',
    description:
      'Create a workflow from the starter template, add a step by hand, let the workflow assistant add another, then run it and check what every step produced — a narrated walkthrough in eight steps.',
    youtubeId: 'g02LJwso1yk',
    category: 'Tutorials',
    date: '2026-09-27',
    docsUrl: 'https://docs.enconvo.ai/workflows/build-your-first-workflow',
  },
  {
    slug: 'excel-mcp-agent',
    title: 'Create and edit Excel workbooks with your AI agent',
    description:
      'Hand your spreadsheets to Enconvo. With the Excel MCP server, the agent creates workbooks, reads your data, and applies edits for you — no manual cell wrangling.',
    youtubeId: 'K_Mmt0eVqRs',
    category: 'Apps & Office',
    date: '2025-08-12',
  },
  {
    slug: 'gmail-weather-workflow',
    title: 'Email yourself AI weather and outfit briefings on a schedule',
    description:
      'Build a workflow that checks the forecast, asks the agent for travel and clothing suggestions, and sends the briefing to your Gmail inbox — hands-free, every day.',
    youtubeId: '0Hfsxw6LG6Y',
    category: 'Workflows',
    date: '2025-06-07',
  },
  {
    slug: 'nvda-trading-strategy-backtest',
    title: 'Build and Backtest an NVDA Trading Strategy with Enconvo',
    description:
      'Ask Enconvo to analyze an NVDA chart, write a Pine Script strategy, and backtest it in TradingView — all from the sidebar.',
    youtubeId: 'eH7iKo0DqHM',
    category: 'AI Agent',
    date: '2026-07-15',
  },
  {
    slug: 'resume-to-personal-website',
    title: 'Turn Your Résumé into a Personal Website with Enconvo',
    description:
      'Turn a résumé into a polished personal website with Standing. Enconvo reads the CV, builds the page, and helps publish a professional online presence from your Mac.',
    youtubeId: '9K5ppGhsU6E',
    category: 'AI Agent',
    date: '2026-07-15',
  },
  {
    slug: 'dynamic-island-quick-start',
    title: 'Get Started with Enconvo from the Dynamic Island',
    description:
      'Set up Enconvo’s Dynamic Island, choose your AI models, and launch any command with a hover — without breaking your flow.',
    youtubeId: 'jVSxuPfvNw8',
    category: 'Everyday Tools',
    date: '2026-07-15',
  },
  {
    slug: 'browser-use-agent',
    title: 'Let an Enconvo AI Agent Research and Build in Your Browser',
    description:
      'Give Enconvo’s AI agent a goal and watch it research the web, use browser tools, and build a polished result for you.',
    youtubeId: 'VXMso0CG_RM',
    category: 'AI Agent',
    date: '2026-07-15',
  },
  {
    slug: 'dynamic-island-tools',
    title: 'Run AI Tools from Enconvo’s Dynamic Island',
    description:
      'Search the web, analyze images, launch commands, and use your favorite AI tools directly from Enconvo’s Dynamic Island.',
    youtubeId: 'Dm211JR-6YQ',
    category: 'Everyday Tools',
    date: '2026-07-15',
  },
  {
    slug: 'popbar-instant-actions',
    title: 'Select Text and Act Instantly with Enconvo PopBar',
    description:
      'Select any text on your Mac, then translate, rewrite, summarize, or send it to AI instantly with Enconvo PopBar — without switching apps.',
    youtubeId: 'yvU5Lc62lEE',
    category: 'Everyday Tools',
    date: '2026-07-15',
  },
  {
    slug: 'excel-sidebar-ai',
    title: 'Edit Excel with AI from the Enconvo Sidebar',
    description:
      'Open Enconvo beside Microsoft Excel and let AI analyze your workbook, explain the data, and make spreadsheet changes while you stay in context.',
    youtubeId: '4mJcBRJK-fc',
    category: 'Apps & Office',
    date: '2026-07-15',
  },
  {
    slug: 'claude-pro-max',
    title: 'Use your Claude Pro or Max subscription in Enconvo',
    description:
      'Connect the Claude plan you already pay for and chat with Claude models across Enconvo — no separate API key required.',
    youtubeId: '179-UULME_g',
    category: 'Providers & Models',
    date: '2025-08-19',
  },
  {
    slug: 'model-provider-settings',
    title: 'Configure model providers and add custom models',
    description:
      'Set up provider credentials once in the global settings, then add or edit any model — including custom endpoints — from a single screen.',
    youtubeId: 'V-xXxb53mkc',
    category: 'Providers & Models',
    date: '2025-08-12',
  },
  {
    slug: 'seamless-ocr',
    title: 'Grab text from anything on screen with OCR',
    description:
      'Capture a region of your screen and Enconvo extracts the text instantly — from screenshots, PDFs, images, or apps that block copying.',
    youtubeId: 'A_LMrA-CEDI',
    category: 'Everyday Tools',
    date: '2025-04-22',
  },
  {
    slug: 'agent-mode-tetris',
    title: 'Build a playable Tetris game with Agent Mode',
    description:
      'Watch Agent Mode plan, write, and iterate on a working Tetris web game from a single prompt — a quick tour of what agentic coding can do.',
    youtubeId: 'Pgz6AY5vYho',
    category: 'AI Agent',
    date: '2025-04-14',
  },
]
