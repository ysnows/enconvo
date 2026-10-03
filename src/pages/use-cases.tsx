import { I18nText } from '@/i18n/I18nText'
import { i18nStaticProps } from '@/i18n/server'
import { localizePath } from '@/i18n/locale'
import { useI18n } from '@/i18n/I18nProvider'
import { canonicalUrl } from '@/i18n/locale'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import { Dialog } from '@headlessui/react'
import { ArrowUpRight, X } from 'lucide-react'
import { Footer } from '@/components/Footer'
import { SiteNav } from '@/components/SiteNav'
import { UseCaseGallery } from '@/components/UseCaseGallery'
import { useCases, type UseCase } from '@/data/useCases'
import { newestFirst } from '@/lib/useCaseDiscovery'
import styles from '@/styles/Discovery.module.css'

const all = newestFirst(useCases)
const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`
function structuredData(locale, t) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: all.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'VideoObject',
        name: t(item.title),
        description: t(item.description),
        thumbnailUrl: `https://i.ytimg.com/vi/${item.youtubeId}/hqdefault.jpg`,
        uploadDate: item.date,
        embedUrl: `https://www.youtube-nocookie.com/embed/${item.youtubeId}`,
        contentUrl: watchUrl(item.youtubeId),
        url: `${canonicalUrl('/use-cases', locale)}#${item.slug}`,
        inLanguage: locale,
      },
    })),
  }).replace(/</g, '\\u003c')
}

export default function UseCasesPage() {
  const { t, locale } = useI18n()

  const [activeCase, setActiveCase] = useState<UseCase | null>(null)

  function openCase(item: UseCase) {
    setActiveCase(item)
    // Preserve Next's router state and any incoming query string.
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.search}#${item.slug}`
    )
  }

  function closeCase() {
    setActiveCase(null)
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.search}`
    )
  }

  useEffect(() => {
    function openFromHash() {
      const slug = window.location.hash.slice(1)
      const target = useCases.find((item) => item.slug === slug)
      setActiveCase(target || null)
      if (target)
        document.getElementById(slug)?.scrollIntoView({ block: 'center' })
    }
    openFromHash()
    window.addEventListener('hashchange', openFromHash)
    return () => window.removeEventListener('hashchange', openFromHash)
  }, [])

  return (
    <>
      <Head>
        <title>{t('Enconvo Use Cases - Video Walkthroughs')}</title>
        <link
          rel="canonical"
          href={canonicalUrl('/use-cases', locale)}
          key="canonical"
        />
        <meta
          name="description"
          content={t(
            'Find your next task with Enconvo. Search real video walkthroughs for writing, research, Excel, workflows, and AI agents on your Mac.'
          )}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: structuredData(locale, t) }}
        />
      </Head>
      <div className={styles.page}>
        <a href="#walkthroughs" className={styles.skip}>
          {t('Skip to walkthroughs')}
        </a>
        <SiteNav />
        <main id="walkthroughs" tabIndex={-1}>
          <div className={`${styles.container} ${styles.pageHero}`}>
            <p className={styles.eyebrow}>
              <I18nText
                source={'{p0} real tasks. One Mac assistant.'}
                values={{ p0: all.length }}
              />
            </p>
            <h1>
              {t('A little inspiration.')}
              <br />
              {t('A lot less busywork.')}
            </h1>
            <p className={styles.intro}>
              {t(
                'From your first quick edit to a workflow that runs itself. Find a task, watch it happen, and make it part of your day.'
              )}
            </p>
          </div>
          <section
            aria-label={t('Video walkthroughs')}
            className={`${styles.container} ${styles.pageContent}`}
          >
            <h2 className="sr-only">{t('Explore walkthroughs')}</h2>
            <UseCaseGallery items={all} onOpen={openCase} />
            <div className={styles.footnote}>
              <p>{t('New ideas for the tools you already use.')}</p>
              <a
                href="https://www.youtube.com/@enconvo"
                target="_blank"
                rel="noreferrer"
              >
                {t('Explore the Enconvo YouTube channel ↗')}
              </a>
            </div>
          </section>
        </main>
        <Footer />
      </div>
      <Dialog
        open={Boolean(activeCase)}
        onClose={closeCase}
        className={styles.dialog}
      >
        <div className={styles.backdrop} aria-hidden="true" />
        <div className={styles.dialogPosition}>
          {activeCase && (
            <Dialog.Panel className={styles.dialogPanel}>
              <div className={styles.dialogHeader}>
                <Dialog.Title>{t(activeCase.title)}</Dialog.Title>
                <button
                  type="button"
                  onClick={closeCase}
                  aria-label={t('Close video')}
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <div className={styles.video}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeCase.youtubeId}?autoplay=1&rel=0`}
                  title={t(activeCase.title)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className={styles.videoMeta}>
                <span>{t(activeCase.category)}</span>
                <a
                  href={localizePath(watchUrl(activeCase.youtubeId), locale)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('Watch on YouTube ')}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </div>
            </Dialog.Panel>
          )}
        </div>
      </Dialog>
    </>
  )
}

export const getStaticProps = i18nStaticProps('/use-cases')
