import { SITE_URL } from './siteMetadata'

interface SocialPage {
  title: string
  description: string
  image: string
  imageAlt: string
}

const brandImage = {
  image: '/og/enconvo-speak-select-ask-v3.jpg',
  imageAlt:
    'Enconvo — Speak it. Select it. Ask it. The Dynamic Island, the PopBar over selected text, and the SmartBar.',
}

// Public pages only. Private, payment, auth, API and placeholder routes must not
// inherit a public marketing card. Images are static, versioned JPEGs.
export const socialPages: Record<string, SocialPage> = {
  '/': {
    title: 'Enconvo — The assistant you were promised.',
    description:
      'An AI agent that understands your screen and works inside your apps, on your computer and your phone. Organize files, write, research, and get things done with Enconvo.',
    ...brandImage,
  },
  '/use-cases': {
    title: 'Enconvo Use Cases — See what Enconvo can do.',
    description:
      'Explore real video walkthroughs for writing, research, Excel, workflows, and AI agents.',
    image: '/og/enconvo-use-cases-v2.jpg',
    imageAlt:
      'Enconvo — See what Enconvo can do. Illustrated video previews show a spreadsheet, a website, and an automated workflow.',
  },
  '/love': {
    title: 'What People Say About Enconvo',
    description:
      "Posts about Enconvo in people's own words, each linked to where it was written.",
    ...brandImage,
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
    title: 'Enconvo Releases — A better assistant, every release.',
    description:
      'Read the latest Enconvo release notes, beta updates, new features, improvements, and fixes.',
    image: '/og/enconvo-changelog-v2.jpg',
    imageAlt:
      'Enconvo — A better assistant, every release. A release timeline highlights New features, Improvements, and Fixes.',
  },
  '/android': {
    title: 'Enconvo for Android — Google Play and APK',
    description:
      'Get Enconvo for Android on Google Play or as an APK, and pair it with Enconvo on your computer to use its agents and chats from your phone.',
    ...brandImage,
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
  const page = Object.hasOwn(socialPages, pathname)
    ? socialPages[pathname]
    : undefined
  return page
    ? {
        ...page,
        url: `${SITE_URL}${pathname}`,
        image: `${SITE_URL}${page.image}`,
      }
    : null
}
