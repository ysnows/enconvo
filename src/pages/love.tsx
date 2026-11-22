import { useMemo, useState } from 'react'
import Head from 'next/head'
import { Footer } from '@/components/Footer'
import { SiteNav } from '@/components/SiteNav'
import { LoveCards, SourceGlyph } from '@/components/love/LoveCards'
import {
  DISCORD_INVITE,
  sourceList,
  sourceNames,
  type LovePost,
  type LoveSource,
} from '@/data/love'
import data from '@/data/love.json'
import { useI18n } from '@/i18n/I18nProvider'
import { canonicalUrl } from '@/i18n/locale'
import { i18nStaticProps } from '@/i18n/server'
import { trackEvent } from '@/lib/analytics'
import styles from '@/styles/Love.module.css'

const posts = data.posts as LovePost[]
const sources = (['discord', 'reddit', 'facebook'] as LoveSource[]).filter(
  (source) => posts.some((post) => post.source === source)
)
/** How many posts a tab shows before "Show more". */
const FIRST = 30

export default function LovePage() {
  const { t, locale } = useI18n()
  const [source, setSource] = useState<LoveSource | 'all'>('all')
  const [all, setAll] = useState(false)
  const matching = useMemo(
    () =>
      source === 'all' ? posts : posts.filter((post) => post.source === source),
    [source]
  )
  const shown = all ? matching : matching.slice(0, FIRST)
  const tabs = [
    { id: 'all' as const, label: t('All'), count: posts.length },
    ...sources.map((id) => ({
      id,
      label: sourceNames[id],
      count: posts.filter((post) => post.source === id).length,
    })),
  ]

  return (
    <>
      <Head>
        <title>{t('What people say about Enconvo')}</title>
        <link
          rel="canonical"
          href={canonicalUrl('/love', locale)}
          key="canonical"
        />
        <meta
          name="description"
          content={t(
            'Read what people write about Enconvo in their own words, with a link to every original post.'
          )}
        />
      </Head>
      <div className={styles.lovePage}>
        <a href="#posts" className={styles.skip}>
          {t('Skip to posts')}
        </a>
        <SiteNav />
        <main className={styles.container}>
          <div className={styles.heading}>
            <p className={styles.kicker}>{t('From the community')}</p>
            <h1>{t('What people say about Enconvo')}</h1>
            <p className={styles.intro} suppressHydrationWarning>
              {t(
                "Posts from {p0}, in people's own words. Open any one to read it where it was written.",
                { p0: sourceList(sources, locale) }
              )}
            </p>
          </div>

          <div role="group" aria-label={t('Source')} className={styles.tabs}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={source === tab.id}
                className={styles.tab}
                onClick={() => {
                  setSource(tab.id)
                  setAll(false)
                  trackEvent('love_filter', { source: tab.id })
                }}
              >
                {tab.label}
                <span>{tab.count}</span>
              </button>
            ))}
          </div>

          <div id="posts" tabIndex={-1} className={styles.panel}>
            <LoveCards posts={shown} placement="page" />
            {shown.length < matching.length && (
              <div className={styles.more}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    setAll(true)
                    trackEvent('love_show_more', { source })
                  }}
                >
                  {t('Show {p0} more', { p0: matching.length - shown.length })}
                </button>
              </div>
            )}
          </div>

          <div className={styles.closing}>
            <div>
              <h2>{t("Using Enconvo? Tell us how it's going.")}</h2>
              <p>
                {t(
                  'Post in #general. If a post of yours is here and you would rather it was not, tell us and we will take it down.'
                )}
              </p>
            </div>
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noreferrer"
              className={styles.primaryButton}
              onClick={() =>
                trackEvent('love_cta_click', {
                  target: 'discord',
                  placement: 'page',
                })
              }
            >
              <SourceGlyph source="discord" />
              {t('Join the Discord')}
            </a>
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}

export const getStaticProps = i18nStaticProps('/love')
