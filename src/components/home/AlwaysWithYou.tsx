import { localizePath } from '@/i18n/locale'
import { useI18n } from '@/i18n/I18nProvider'
import Link from 'next/link'
import { Download, Smartphone } from 'lucide-react'
import { CompanionVisual } from './SectionVisuals'
import styles from '@/styles/Home.module.css'
import { Container } from '@/components/Container'
import {
  ANDROID_APP_MIN_ANDROID_VERSION,
  ANDROID_APP_QR,
  ANDROID_APP_SECTION_ID,
  ANDROID_APP_VERSION,
} from '@/data/androidApp'
import {
  IPHONE_APP_QR,
  IPHONE_APP_SECTION_ID,
  IPHONE_APP_TESTFLIGHT_URL,
  MOBILE_APP_SECTION_ID,
} from '@/data/iphoneApp'
import { trackEvent } from '@/lib/analytics'

function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  )
}

function AndroidGlyph() {
  return (
    <svg viewBox="0 4.5 24 14" fill="currentColor" aria-hidden="true">
      <path d="M17.6 9.48l1.84-3.18a.38.38 0 00-.66-.38l-1.86 3.22A11.4 11.4 0 0012 8.08a11.4 11.4 0 00-4.92 1.06L5.22 5.92a.38.38 0 10-.66.38L6.4 9.48A10.8 10.8 0 001 18h22a10.8 10.8 0 00-5.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
    </svg>
  )
}

export function AlwaysWithYou() {
  const { t, locale } = useI18n()

  return (
    <section
      id="always-with-you"
      aria-label={t('Always with you')}
      className={styles.section}
    >
      <Container className={styles.sectionContainer}>
        <div className={styles.sectionHeading} data-reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-content-ash">
            {t('On your desktop. In your pocket.')}
          </p>
          <h2 className="font-display mt-3 text-3xl tracking-tight text-content sm:text-4xl">
            {t(
              'Track your agents on the desktop and command your Mac from Telegram, Discord or Slack'
            )}
          </h2>
        </div>

        <div
          className={`${styles.cards} mx-auto mt-12 grid grid-cols-1 md:grid-cols-2`}
        >
          <div
            className={`${styles.card} ${styles.companionCard}`}
            data-spotlight
            data-reveal
          >
            <CompanionVisual kind="pet" />
            <div className={styles.companionCopy}>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-signal-green">
                {t('Pet')}
              </span>
              <h3 className="font-display mt-2 text-xl font-semibold text-content">
                {t('A tiny companion that watches your agents work')}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-content-muted">
                {t(
                  'A pixel-art pet lives on your desktop and mirrors what your agents are doing — running, done, or waiting on you. Tap it to jump straight to the session that needs attention. Compatible with the open Codex pet-pack format, so community characters just work.'
                )}
              </p>
            </div>
          </div>

          <div
            className={`${styles.card} ${styles.companionCard}`}
            data-spotlight
            data-reveal
          >
            <CompanionVisual kind="channels" />
            <div className={styles.companionCopy}>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-signal-blue">
                {t('IM Channels')}
              </span>
              <h3 className="font-display mt-2 text-xl font-semibold text-content">
                {t('Command your Mac from anywhere')}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-content-muted">
                {t(
                  "Away from your desk? Message your agent from Telegram, Discord, Slack, or Feishu — it runs the task on your Mac and reports back when it's done."
                )}
              </p>
            </div>
          </div>

          <div
            id={MOBILE_APP_SECTION_ID}
            className={`${styles.card} ${styles.mobileCard} md:col-span-2`}
            data-spotlight
            data-reveal
          >
            <div className={styles.mobileIntro}>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-signal-yellow">
                {t('iPhone & Android app')}
              </span>
              <h3 className="font-display mt-2 text-xl font-semibold text-content">
                {t("Your Mac's chats, in your pocket")}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-content-muted">
                {t(
                  'Pair your iPhone or Android phone with Enconvo on your Mac to reach its projects and chats from anywhere. Every chat keeps running on your Mac, and messages are end-to-end encrypted.'
                )}
              </p>
            </div>

            <div className={styles.mobilePlatforms}>
              <div id={IPHONE_APP_SECTION_ID} className={styles.mobilePlatform}>
                <div className={styles.mobilePlatformCopy}>
                  <div className={styles.mobilePlatformName}>
                    <AppleGlyph />
                    <span>iPhone</span>
                    <span className={styles.mobileTagBeta}>{t('Beta')}</span>
                  </div>
                  <p className={styles.mobilePlatformMeta}>
                    {t('Free beta on TestFlight')}
                  </p>
                  <div className={styles.iphoneActions}>
                    <a
                      href={localizePath(IPHONE_APP_TESTFLIGHT_URL, locale)}
                      onClick={() =>
                        trackEvent('iphone_app_click', {
                          placement: 'always_with_you',
                        })
                      }
                      target="_blank"
                      rel="noreferrer"
                      className={styles.iphoneButton}
                    >
                      <Smartphone aria-hidden="true" />
                      {t('Join the TestFlight beta')}
                    </a>
                    <Link
                      href="/use-cases#pair-your-iphone"
                      className={styles.iphoneSecondaryLink}
                    >
                      {t('See how pairing works')}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
                <figure className={styles.iphoneQr}>
                  <svg
                    viewBox={`0 0 ${IPHONE_APP_QR.size} ${IPHONE_APP_QR.size}`}
                    shapeRendering="crispEdges"
                    role="img"
                    aria-label={t(
                      'QR code for the Enconvo iPhone beta on TestFlight'
                    )}
                  >
                    <rect
                      width={IPHONE_APP_QR.size}
                      height={IPHONE_APP_QR.size}
                      fill="#fff"
                    />
                    <path d={IPHONE_APP_QR.path} fill="#07080a" />
                  </svg>
                  <figcaption>{t('Scan with your iPhone camera')}</figcaption>
                </figure>
              </div>

              <div id={ANDROID_APP_SECTION_ID} className={styles.mobilePlatform}>
                <div className={styles.mobilePlatformCopy}>
                  <div className={styles.mobilePlatformName}>
                    <AndroidGlyph />
                    <span>Android</span>
                    <span className={styles.mobileTagBeta}>{t('Beta')}</span>
                  </div>
                  <p className={styles.mobilePlatformMeta}>
                    {t('Version {version} · Android {android} or later', {
                      version: ANDROID_APP_VERSION,
                      android: ANDROID_APP_MIN_ANDROID_VERSION,
                    })}
                  </p>
                  <div className={styles.iphoneActions}>
                    <Link
                      href="/android"
                      onClick={() =>
                        trackEvent('android_app_click', {
                          placement: 'always_with_you',
                        })
                      }
                      className={styles.iphoneButton}
                    >
                      <Download aria-hidden="true" />
                      {t('Get the Android app')}
                    </Link>
                    <Link
                      href="/android#install"
                      className={styles.iphoneSecondaryLink}
                    >
                      {t('How to install')}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
                <figure className={styles.iphoneQr}>
                  <svg
                    viewBox={`0 0 ${ANDROID_APP_QR.size} ${ANDROID_APP_QR.size}`}
                    shapeRendering="crispEdges"
                    role="img"
                    aria-label={t(
                      'QR code for the Enconvo Android download page'
                    )}
                  >
                    <rect
                      width={ANDROID_APP_QR.size}
                      height={ANDROID_APP_QR.size}
                      fill="#fff"
                    />
                    <path d={ANDROID_APP_QR.path} fill="#07080a" />
                  </svg>
                  <figcaption>{t('Scan with your Android phone')}</figcaption>
                </figure>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
