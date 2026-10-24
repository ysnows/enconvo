// Every app the Enconvo team makes, shown on /apps and linked from the footer's
// "More apps". Adding an app is one entry here, its icon in public/brand/, and
// its description in each src/i18n/messages catalog.
// current: the app this site is about. Its card offers the download instead.

export interface TeamApp {
  key: string
  name: string
  url: string
  icon: string
  description: string
  platform: 'macOS'
  price: 'free' | 'freemium'
  current?: boolean
}

export const TEAM_APPS: TeamApp[] = [
  {
    key: 'enconvo',
    name: 'Enconvo',
    url: 'https://www.enconvo.com/',
    icon: '/brand/enconvo-icon-512.png',
    description: 'An AI agent launcher that works across your whole Mac.',
    platform: 'macOS',
    price: 'freemium',
    current: true,
  },
  {
    key: 'neatshot',
    name: 'NeatShot',
    url: 'https://neatshot.app/?utm_source=enconvo.com&utm_medium=referral&utm_content=apps',
    icon: '/brand/neatshot-icon.webp',
    description: 'Free screenshots and screen recording that stay on your Mac.',
    platform: 'macOS',
    price: 'free',
  },
]

/** Price labels, keyed so they stay distinct from the pricing table's plan names. */
export const PRICE_LABELS: Record<TeamApp['price'], string> = {
  free: 'Free to use',
  freemium: 'Free, with paid plans',
}
