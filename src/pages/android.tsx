import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { canonicalUrl } from '@/i18n/locale'
import Head from 'next/head'
import { Check, Download, Smartphone } from 'lucide-react'
import { Footer } from '@/components/Footer'
import {
  metaLabel,
  primaryButton,
  secondaryButton,
} from '@/components/landing-styles'
import { SiteNav } from '@/components/SiteNav'
import {
  ANDROID_APP_APK_URL,
  ANDROID_APP_MIN_ANDROID_VERSION,
  ANDROID_APP_QR,
  ANDROID_APP_VERSION,
} from '@/data/androidApp'
import { IPHONE_APP_TESTFLIGHT_URL } from '@/data/iphoneApp'
import { trackEvent } from '@/lib/analytics'

// Where the Android app is installed from: the APK, how to sideload it, and how
// to pair it. The homepage card, the QR codes and the Mac app's Connections
// card all lead here.

const MAC_DOWNLOAD_URL = 'https://api.enconvo.com/app/download'

const STEPS = [
  {
    title: 'Download the APK',
    body: 'Tap Download APK on your phone. If your browser warns about the file type, choose Download anyway.',
  },
  {
    title: 'Allow the install',
    body: 'Open the downloaded file. When Android asks, allow your browser to install unknown apps, then tap Install.',
  },
  {
    title: 'Open Enconvo',
    body: 'Open Enconvo on your phone. On Connect your Mac, tap Scan pairing code.',
  },
  {
    title: 'Pair with your Mac',
    body: "On your Mac, open Enconvo Settings → Connections and click Show pairing code, or Pair another phone if a phone is already paired. Scan the code, and the phone signs in with your Mac's Enconvo account.",
  },
]

const card = 'rounded-[10px] border border-hairline bg-surface-card p-6'

export default function AndroidPage() {
  const { t, locale } = useI18n()
  const versions = {
    version: ANDROID_APP_VERSION,
    android: ANDROID_APP_MIN_ANDROID_VERSION,
  }

  return (
    <>
      <Head>
        <title>{t('Enconvo for Android — Download the APK')}</title>
        <meta
          name="description"
          content={t(
            'Download the Enconvo Android beta and pair it with Enconvo on your Mac to use its agents and chats from your phone.'
          )}
        />
        <link
          rel="canonical"
          href={canonicalUrl('/android', locale)}
          key="canonical"
        />
      </Head>
      <div className="min-h-screen bg-canvas text-content">
        <SiteNav />
        <main className="mx-auto max-w-[1080px] px-4 pb-24 pt-32 sm:px-6 sm:pt-40 lg:px-12">
          <section className="flex items-center justify-between gap-12">
            <div className="min-w-0 max-w-2xl">
              <div className="flex items-center gap-3">
                <p className={metaLabel}>{t('Android app')}</p>
                <span className="rounded-full bg-signal-yellow/[0.12] px-2 py-0.5 text-[10px] font-semibold uppercase leading-4 tracking-[0.08em] text-signal-yellow">
                  {t('Beta')}
                </span>
              </div>
              <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl sm:leading-[1.1]">
                {t('Enconvo for Android')}
              </h1>
              <p className="mt-5 text-base leading-7 text-content-body sm:text-lg sm:leading-8">
                {t(
                  'Pair your Android phone with Enconvo on your Mac and take its agents and chats with you. Mac chats keep running on your Mac, and messages are end-to-end encrypted. The phone has chats of its own too, so you can start before you pair.'
                )}
              </p>
              <div className="mt-8">
                <a
                  href={ANDROID_APP_APK_URL}
                  onClick={() =>
                    trackEvent('download_click', {
                      platform: 'android',
                      placement: 'android_page',
                    })
                  }
                  className={`${primaryButton} w-full sm:w-auto`}
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  {t('Download APK')}
                </a>
                <p className="mt-3 text-sm text-content-muted">
                  {t('Version {version} · Android {android} or later', versions)}
                </p>
              </div>
            </div>

            <figure className="m-0 hidden flex-none flex-col items-center gap-3 md:flex">
              <svg
                viewBox={`0 0 ${ANDROID_APP_QR.size} ${ANDROID_APP_QR.size}`}
                shapeRendering="crispEdges"
                role="img"
                aria-label={t('QR code for the Enconvo Android download page')}
                className="h-[168px] w-[168px] rounded-[10px]"
              >
                <rect
                  width={ANDROID_APP_QR.size}
                  height={ANDROID_APP_QR.size}
                  fill="#fff"
                />
                <path d={ANDROID_APP_QR.path} fill="#07080a" />
              </svg>
              <figcaption className="max-w-[200px] text-center text-xs leading-5 text-content-muted">
                {t(
                  'On a computer? Scan with your Android phone to open this page there.'
                )}
              </figcaption>
            </figure>
          </section>

          <section id="install" className="mt-20 scroll-mt-28 sm:mt-24">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              {t('Install in four steps')}
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-content-muted">
              {t(
                "The beta isn't on Google Play yet, so you install the APK from this page. Android asks once before it lets your browser install apps."
              )}
            </p>
            <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <li key={step.title} className={`${card} p-5`}>
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-hairline-strong text-xs font-semibold text-content"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold leading-6">
                    {t(step.title)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-content-muted">
                    {t(step.body)}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-16 grid gap-3 md:grid-cols-2">
            <div className={card}>
              <h2 className="text-lg font-semibold">{t('What you need')}</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-content-body">
                {[
                  t(
                    'A Mac running Enconvo, signed in to your Enconvo account. Pairing signs the phone in to the same account.'
                  ),
                  t('An Android phone with Android {android} or later.', versions),
                  t(
                    "Internet on both devices. They don't have to share a Wi-Fi network."
                  ),
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check
                      className="mt-1 h-4 w-4 flex-none text-signal-green"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm text-content-muted">
                {t("Don't have Enconvo on your Mac yet?")}{' '}
                <a
                  href={MAC_DOWNLOAD_URL}
                  onClick={() =>
                    trackEvent('download_click', {
                      arch: 'auto',
                      placement: 'android_page',
                    })
                  }
                  className="font-medium text-content underline decoration-hairline-strong underline-offset-4 hover:decoration-content"
                >
                  {t('Download for macOS')}
                </a>
              </p>
            </div>

            <div className={`${card} flex flex-col`}>
              <h2 className="text-lg font-semibold">{t('On an iPhone?')}</h2>
              <p className="mt-4 text-sm leading-6 text-content-body">
                {t(
                  'The Enconvo iPhone app is in beta on TestFlight. It pairs with your Mac the same way.'
                )}
              </p>
              <div className="mt-5 sm:mt-auto sm:pt-5">
                <a
                  href={IPHONE_APP_TESTFLIGHT_URL}
                  onClick={() =>
                    trackEvent('iphone_app_click', {
                      placement: 'android_page',
                    })
                  }
                  target="_blank"
                  rel="noreferrer"
                  className={`${secondaryButton} w-full sm:w-auto`}
                >
                  <Smartphone className="h-4 w-4" aria-hidden="true" />
                  {t('Join the TestFlight beta')}
                </a>
              </div>
            </div>
          </section>

          <p className="mt-10 text-sm leading-6 text-content-ash">
            {t(
              'The app checks for updates and installs them for you. You can also download the latest APK here and install it over the app you have.'
            )}
          </p>
        </main>
        <Footer />
      </div>
    </>
  )
}

export const getStaticProps = i18nStaticProps('/android')
