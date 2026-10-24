import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { canonicalUrl } from '@/i18n/locale'
import Head from 'next/head'
import { ArrowUpRight, Download } from 'lucide-react'
import { Footer } from '@/components/Footer'
import {
  metaLabel,
  primaryButton,
  secondaryButton,
} from '@/components/landing-styles'
import { SiteNav } from '@/components/SiteNav'
import { PRICE_LABELS, TEAM_APPS } from '@/data/apps'
import { SITE_URL } from '@/data/siteMetadata'
import { trackEvent } from '@/lib/analytics'

// Every app the team makes. The list lives in src/data/apps.ts.

const MAC_DOWNLOAD_URL = 'https://api.enconvo.com/app/download'

function structuredData(locale, t) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('More apps from the Enconvo team'),
    url: canonicalUrl('/apps', locale),
    itemListElement: TEAM_APPS.map((app, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: app.name,
        // The listed link without its referral parameters.
        url: app.current ? canonicalUrl('/', locale) : app.url.split('?')[0],
        image: `${SITE_URL}${app.icon}`,
        description: t(app.description),
        operatingSystem: app.platform,
        applicationCategory: app.current
          ? 'ProductivityApplication'
          : 'UtilitiesApplication',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        inLanguage: locale,
      },
    })),
  }).replace(/</g, '\\u003c')
}

export default function AppsPage() {
  const { t, locale } = useI18n()

  return (
    <>
      <Head>
        <title>{t('More apps from the Enconvo team')}</title>
        <meta
          name="description"
          content={t(
            'Every app the Enconvo team makes, in one place: Enconvo, an AI agent launcher for Mac, and NeatShot, free screenshots and screen recording for Mac.'
          )}
        />
        <link
          rel="canonical"
          href={canonicalUrl('/apps', locale)}
          key="canonical"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: structuredData(locale, t) }}
        />
      </Head>
      <div className="min-h-screen bg-canvas text-content">
        <SiteNav />
        <main className="mx-auto max-w-[1080px] px-4 pb-24 pt-32 sm:px-6 sm:pt-40 lg:px-12">
          <section className="max-w-2xl">
            <p className={metaLabel}>{t('More apps')}</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl sm:leading-[1.1]">
              {t('More apps from the Enconvo team')}
            </h1>
            <p className="mt-5 text-base leading-7 text-content-body sm:text-lg sm:leading-8">
              {t('Everything the team behind Enconvo makes, in one place.')}
            </p>
          </section>

          <ul className="mt-14 grid gap-3 sm:mt-16 md:grid-cols-2">
            {TEAM_APPS.map((app) => (
              <li
                key={app.key}
                id={app.key}
                className="flex flex-col gap-4 rounded-[10px] border border-hairline bg-surface-card p-6"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={app.icon}
                    alt=""
                    width={64}
                    height={64}
                    loading="lazy"
                    className="h-16 w-16 flex-none"
                  />
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold leading-7">
                      {app.name}
                    </h2>
                    {app.current && (
                      <span className="mt-1 inline-block rounded-[4px] bg-signal-green/[0.12] px-2 py-0.5 text-[10px] font-semibold uppercase leading-4 tracking-[0.08em] text-signal-green">
                        {t('This app')}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm leading-6 text-content-body">
                  {t(app.description)}
                </p>
                <p className="text-[13px] leading-5 text-content-muted">
                  {app.platform} · {t(PRICE_LABELS[app.price])}
                </p>
                <div className="mt-auto pt-2">
                  {app.current ? (
                    <a
                      href={MAC_DOWNLOAD_URL}
                      onClick={() =>
                        trackEvent('download_click', {
                          arch: 'auto',
                          placement: 'apps_page',
                        })
                      }
                      className={`${primaryButton} w-full sm:w-auto`}
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      {t('Download for macOS')}
                    </a>
                  ) : (
                    <a
                      href={app.url}
                      onClick={() =>
                        trackEvent(`${app.key}_app_click`, {
                          placement: 'apps_page',
                        })
                      }
                      target="_blank"
                      rel="noreferrer"
                      className={`${secondaryButton} w-full sm:w-auto`}
                    >
                      {t('Visit website')}
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </main>
        <Footer />
      </div>
    </>
  )
}

export const getStaticProps = i18nStaticProps('/apps')
