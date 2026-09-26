import { SITE_URL } from './siteMetadata'

interface SocialPage {
  title: string
  description: string
  image: string
  imageAlt: string
}

const brandImage = {
  image: '/og/enconvo-mac-agent-v1.jpg',
  imageAlt:
    'Enconvo — The assistant your Mac was promised. A native AI sidebar organizes files alongside Finder, framed by blue light ribbons.',
}

// Public pages only. Private, payment, auth, API and placeholder routes must not
// inherit a public marketing card. Images are static, versioned JPEGs.
export const socialPages: Record<string, SocialPage> = {
  '/': {
    title: 'Enconvo — The assistant your Mac was promised.',
    description:
      'An AI agent that understands your screen and works in your Mac apps. Organize files, write, research, and get things done with Enconvo.',
    ...brandImage,
  },
  '/use-cases': {
    title: 'Enconvo Use Cases — See what your Mac can do.',
    description:
      'Explore real video walkthroughs for writing, research, Excel, workflows, and AI agents on your Mac.',
    image: '/og/enconvo-use-cases-v1.jpg',
    imageAlt:
      'Enconvo — See what your Mac can do. Illustrated video previews show a spreadsheet, a website, and an automated workflow.',
  },
  '/cloud-pricing': {
    title: 'Enconvo Cloud Pricing — Models & Services',
    description:
      'Explore Enconvo Cloud point rates for chat, image and video generation, speech, search, and document services.',
    image: '/og/enconvo-cloud-pricing-v1.jpg',
    imageAlt:
      'Enconvo Cloud — One balance. Every kind of AI. A glass panel presents Chat, Images, Video, Speech, and Search.',
  },
  '/changelog': {
    title: 'Enconvo Releases — A better Mac assistant.',
    description:
      'Read the latest Enconvo release notes, beta updates, new features, improvements, and fixes.',
    image: '/og/enconvo-changelog-v1.jpg',
    imageAlt:
      'Enconvo — A better Mac assistant. A release timeline highlights New features, Improvements, and Fixes.',
  },
  '/privacy': {
    title: 'Enconvo Privacy Policy',
    description: 'How Enconvo handles app permissions, data, and privacy.',
    ...brandImage,
  },
  '/terms': {
    title: 'Enconvo Terms of Use',
    description: 'Terms of use for the Enconvo macOS application.',
    ...brandImage,
  },
}

export function getSocialMetadata(pathname: string) {
  // /downloads currently contains the legacy privacy-policy duplicate, not an
  // installer page; mirror its existing canonical URL without changing routing.
  const canonicalPath = pathname === '/downloads' ? '/privacy' : pathname
  const page = Object.hasOwn(socialPages, canonicalPath)
    ? socialPages[canonicalPath]
    : undefined
  return page
    ? {
        ...page,
        url: `${SITE_URL}${canonicalPath}`,
        image: `${SITE_URL}${page.image}`,
      }
    : null
}
