export interface UseCase {
  /** Stable anchor id — /use-cases#<slug> deep-links to this entry */
  slug: string
  title: string
  description: string
  youtubeId: string
  category: string
  /** YouTube publish date, YYYY-MM-DD. Non-featured entries sort newest-first. */
  date: string
  /** Featured entries are pinned on top in data-file order. */
  featured?: boolean
  /** Optional "Read the guide" link into docs.enconvo.ai */
  docsUrl?: string
}

export const useCases: UseCase[] = [
  {
    slug: 'excel-mcp-agent',
    title: 'Create and edit Excel workbooks with your AI agent',
    description:
      'Hand your spreadsheets to Enconvo. With the Excel MCP server, the agent creates workbooks, reads your data, and applies edits for you — no manual cell wrangling.',
    youtubeId: 'K_Mmt0eVqRs',
    category: 'Apps & Office',
    date: '2025-08-12',
    featured: true,
  },
  {
    slug: 'gmail-weather-workflow',
    title: 'Email yourself AI weather and outfit briefings on a schedule',
    description:
      'Build a workflow that checks the forecast, asks the agent for travel and clothing suggestions, and sends the briefing to your Gmail inbox — hands-free, every day.',
    youtubeId: '0Hfsxw6LG6Y',
    category: 'Workflows',
    date: '2025-06-07',
    featured: true,
  },
  {
    slug: 'nvda-trading-strategy-backtest',
    title: 'Build and Backtest an NVDA Trading Strategy with EnConvo',
    description:
      'Ask EnConvo to analyze an NVDA chart, write a Pine Script strategy, and backtest it in TradingView — all from the sidebar.',
    youtubeId: 'eH7iKo0DqHM',
    category: 'AI Agent',
    date: '2026-07-15',
  },
  {
    slug: 'resume-to-personal-website',
    title: 'Turn Your Résumé into a Personal Website with EnConvo',
    description:
      'Turn a résumé into a polished personal website with Standing. EnConvo reads the CV, builds the page, and helps publish a professional online presence from your Mac.',
    youtubeId: '9K5ppGhsU6E',
    category: 'AI Agent',
    date: '2026-07-15',
  },
  {
    slug: 'dynamic-island-quick-start',
    title: 'Get Started with EnConvo from the Dynamic Island',
    description:
      'Set up EnConvo’s Dynamic Island, choose your AI models, and launch any command with a hover — without breaking your flow.',
    youtubeId: 'jVSxuPfvNw8',
    category: 'Everyday Tools',
    date: '2026-07-15',
  },
  {
    slug: 'browser-use-agent',
    title: 'Let an EnConvo AI Agent Research and Build in Your Browser',
    description:
      'Give EnConvo’s AI agent a goal and watch it research the web, use browser tools, and build a polished result for you.',
    youtubeId: 'VXMso0CG_RM',
    category: 'AI Agent',
    date: '2026-07-15',
  },
  {
    slug: 'dynamic-island-tools',
    title: 'Run AI Tools from EnConvo’s Dynamic Island',
    description:
      'Search the web, analyze images, launch commands, and use your favorite AI tools directly from EnConvo’s Dynamic Island.',
    youtubeId: 'Dm211JR-6YQ',
    category: 'Everyday Tools',
    date: '2026-07-15',
  },
  {
    slug: 'popbar-instant-actions',
    title: 'Select Text and Act Instantly with EnConvo PopBar',
    description:
      'Select any text on your Mac, then translate, rewrite, summarize, or send it to AI instantly with EnConvo PopBar — without switching apps.',
    youtubeId: 'yvU5Lc62lEE',
    category: 'Everyday Tools',
    date: '2026-07-15',
  },
  {
    slug: 'excel-sidebar-ai',
    title: 'Edit Excel with AI from the EnConvo Sidebar',
    description:
      'Open EnConvo beside Microsoft Excel and let AI analyze your workbook, explain the data, and make spreadsheet changes while you stay in context.',
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
