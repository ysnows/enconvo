import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/Container'
import { LoveCards, SourceGlyph } from '@/components/love/LoveCards'
import { DISCORD_INVITE, sourceList, type LovePost } from '@/data/love'
import home from '@/data/loveHome.json'
import { useI18n } from '@/i18n/I18nProvider'
import { trackEvent } from '@/lib/analytics'
import love from '@/styles/Love.module.css'
import styles from '@/styles/Home.module.css'

export const LOVE_SECTION_ID = 'love'

/** A few of the posts people wrote about Enconvo, each linked to where it was written. */
export function Love() {
  const { t, locale } = useI18n()

  return (
    <section
      id={LOVE_SECTION_ID}
      aria-label={t('From the community')}
      className={styles.section}
    >
      <Container className={styles.sectionContainer}>
        <div className={styles.sectionHeading} data-reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-content-ash">
            {t('From the community')}
          </p>
          <h2 className="font-display mt-3 text-3xl tracking-tight text-content sm:text-4xl">
            {t('Loved by the people who use it every day')}
          </h2>
          <p className="mt-4 text-lg text-content-muted" suppressHydrationWarning>
            {t(
              'Real posts from {p0}. Open any one to read it where it was written.',
              { p0: sourceList(home.sources as LovePost['source'][], locale) }
            )}
          </p>
        </div>

        <LoveCards
          posts={home.posts as LovePost[]}
          phoneIds={home.phone}
          placement="home"
          className="mt-12"
        />

        <div className={love.actions} data-reveal>
          <Link
            href="/love"
            className={styles.browseButton}
            onClick={() =>
              trackEvent('love_cta_click', {
                target: 'all_posts',
                placement: 'home',
              })
            }
          >
            {t('Read all {p0} posts', { p0: home.total })}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noreferrer"
            className={love.textLink}
            onClick={() =>
              trackEvent('love_cta_click', {
                target: 'discord',
                placement: 'home',
              })
            }
          >
            <SourceGlyph source="discord" />
            {t('Join the Discord')}
          </a>
        </div>
      </Container>
    </section>
  )
}
