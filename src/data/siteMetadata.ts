import { canonicalUrl, locales, type Locale } from '@/i18n/locale'
import { heroTabs } from './heroShowcase'

export const SITE_URL = 'https://www.enconvo.com'
export const SITE_DESCRIPTION =
  'A native AI assistant for Mac that works across your apps. Automate tasks, dictate, search your documents, and use cloud AI or local models on macOS.'

// Describe verifiable product facts, without inventing ratings or review counts.
export const homepageStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Enconvo',
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/logo.webp`,
      sameAs: [
        'https://github.com/enconvo',
        'https://twitter.com/enconvo_ai',
        'https://www.youtube.com/@enconvo',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'Enconvo',
      url: `${SITE_URL}/`,
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en',
    },
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/#webpage`,
      url: `${SITE_URL}/`,
      name: 'Enconvo — AI Assistant & Agent for Mac',
      description: SITE_DESCRIPTION,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      mainEntity: { '@id': `${SITE_URL}/#application` },
      inLanguage: 'en',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#application`,
      name: 'Enconvo',
      url: `${SITE_URL}/`,
      description: SITE_DESCRIPTION,
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'macOS 14 or later',
      processorRequirements: 'Intel or Apple Silicon',
      downloadUrl: 'https://api.enconvo.com/app/download',
      screenshot: `${SITE_URL}/posters/app-sidebar.jpg`,
      publisher: { '@id': `${SITE_URL}/#organization` },
      featureList: heroTabs.map((tab) => `${tab.productName}: ${tab.tagline}`),
      offers: {
        '@type': 'Offer',
        name: 'Free tier',
        price: '0',
        priceCurrency: 'USD',
        url: `${SITE_URL}/#pricing`,
      },
    },
  ],
}

export function getHomepageStructuredData(
  locale: Locale,
  t: (source: string) => string
) {
  const url = canonicalUrl('/', locale)
  const graph = homepageStructuredData['@graph'].map((entry) => {
    const item = { ...entry } as Record<string, any>
    if (item['@type'] === 'WebSite') item.inLanguage = locales
    if (
      item['@type'] === 'WebPage' ||
      item['@type'] === 'SoftwareApplication'
    ) {
      item.url = url
      item['@id'] = `${url}#${
        item['@type'] === 'WebPage' ? 'webpage' : 'application'
      }`
      item.description = t(SITE_DESCRIPTION)
      item.inLanguage = locale
      if (item['@type'] === 'WebPage') {
        item.name = t(item.name)
        item.mainEntity = { '@id': `${url}#application` }
      } else {
        item.featureList = heroTabs.map(
          (tab) => `${tab.productName}: ${t(tab.tagline)}`
        )
        item.offers = {
          ...item.offers,
          name: t(item.offers.name),
          url: `${url}#pricing`,
        }
      }
    }
    return item
  })
  return { '@context': 'https://schema.org', '@graph': graph }
}
