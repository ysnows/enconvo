import { localizePath } from '@/i18n/locale'
import Link from 'next/link'
import { useI18n } from '@/i18n/I18nProvider'
import { I18nText } from '@/i18n/I18nText'
import styles from '@/styles/Home.module.css'
import { useEffect, useState } from 'react'
import { HeroDownloadMenu } from '@/components/HeroDownloadMenu'
import { SiteNav } from '@/components/SiteNav'
import { SaleBar, SalePill, useLifetimeSaleNow } from '@/components/Sale'
import { HeroShowcase } from '@/components/HeroShowcase'
import { HeroBackdrop } from '@/components/HeroBackdrop'
import { HeroLayout } from '@/components/home/HeroLayout'
import { trackEvent } from '@/lib/analytics'
import { MOBILE_APP_SECTION_ID } from '@/data/iphoneApp'

declare global {
  interface Window {
    endorsely_referral?: any
  }
}

export function Hero({
  macVersion,
  renderedAt,
}: {
  macVersion?: string
  /** When the static page was generated; it decides whether the first render shows a sale. */
  renderedAt: number
}) {
  const { t, locale } = useI18n()
  const sale = useLifetimeSaleNow(renderedAt)

  const [navElevated, setNavElevated] = useState(false)

  useEffect(() => {
    const updateNav = () => setNavElevated(window.scrollY > 24)
    updateNav()
    window.addEventListener('scroll', updateNav, { passive: true })
    window.addEventListener('pageshow', updateNav)
    return () => {
      window.removeEventListener('scroll', updateNav)
      window.removeEventListener('pageshow', updateNav)
    }
  }, [])

  return (
    <div
      className={`${styles.hero} relative overflow-hidden bg-canvas`}
      data-nav-elevated={navElevated}
      data-sale={sale ? 'true' : undefined}
    >
      <HeroLayout />
      <HeroBackdrop />
      <SiteNav
        banner={
          sale ? <SaleBar sale={sale} renderedAt={renderedAt} /> : undefined
        }
      />

      <div className={styles.heroContent}>
        <div className={styles.heroInner}>
          <div className="w-full">
            <div className={styles.heroCopy}>
              {sale && <SalePill sale={sale} />}
              <h1 className={styles.heroTitle}>
                <I18nText
                  source="The {assistant} you were promised."
                  values={{
                    assistant: (
                      <span className={styles.heroTitleAccent}>
                        {t('assistant')}
                      </span>
                    ),
                  }}
                />
              </h1>

              <p className={styles.heroDescription}>
                {t(
                  'Enconvo is an AI agent that lives across your computer and phone — it sees your screen, works inside your apps, and actually gets things done.'
                )}
              </p>

              <div className={styles.heroActions}>
                <HeroDownloadMenu macVersion={macVersion} />

                <a
                  href={localizePath(`#${MOBILE_APP_SECTION_ID}`, locale)}
                  onClick={() =>
                    trackEvent('mobile_app_click', { placement: 'hero' })
                  }
                  className={styles.browseButton}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <rect
                      x="6"
                      y="2"
                      width="12"
                      height="20"
                      rx="2.5"
                      strokeWidth={1.8}
                    />
                    <path
                      strokeLinecap="round"
                      strokeWidth={1.8}
                      d="M11 18h2"
                    />
                  </svg>
                  <span>{t('iPhone & Android app')}</span>
                </a>
              </div>
              <p className={styles.requirements}>
                {t('Free to start · macOS 14+ · Intel & Apple Silicon')}
              </p>
            </div>

            <HeroShowcase />
          </div>
        </div>
      </div>
    </div>
  )
}
