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
