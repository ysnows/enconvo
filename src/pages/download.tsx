import { useEffect, useState } from 'react'
import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { canonicalUrl } from '@/i18n/locale'
import Head from 'next/head'
import { BookOpen, Download } from 'lucide-react'
import { Footer } from '@/components/Footer'
import {
  metaLabel,
  primaryButton,
  secondaryButton,
} from '@/components/landing-styles'
import { SiteNav } from '@/components/SiteNav'
import {
  AppleLogoIcon,
  LinuxLogoIcon,
  WindowsLogoIcon,
} from '@/components/PlatformIcons'
import { trackEvent } from '@/lib/analytics'

// Every desktop download in one place: the Mac app, and the Windows and Linux
// Betas. The Windows and Linux buttons go through /api/desktop-download, which
// reads the Beta update feed, so they always fetch the newest Beta. The home
// page's Download menu links to the #windows and #linux sections.

const MAC_ARM_URL = 'https://api.enconvo.com/app/download?arch=arm64&platform=darwin'
const MAC_INTEL_URL = 'https://api.enconvo.com/app/download?arch=x64&platform=darwin'
const WINDOWS_GUIDE_URL = 'https://docs.enconvo.ai/getting-started/windows'
const LINUX_GUIDE_URL = 'https://docs.enconvo.ai/getting-started/linux'

type Platform = 'windows' | 'linux'

const downloadUrl = (platform: Platform, format?: string) =>
  `/api/desktop-download?platform=${platform}${format ? `&format=${format}` : ''}`

const card = 'rounded-[10px] border border-hairline bg-surface-card p-6'
// One type scale for every platform card: title, requirement, then the
// smaller version and notes lines.
const cardTitle = 'text-xl font-semibold leading-7'
const cardIcon = 'h-6 w-6 flex-none text-content-muted'
const requirement = 'mt-2 text-[15px] leading-6 text-content-body'
const meta = 'mt-3 text-[13px] leading-5 text-content-muted'
const betaTag =
  'rounded-full border border-hairline-strong px-2 py-0.5 text-xs font-medium leading-4 text-content-muted'
const guideLink =
  'mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-content underline-offset-4 hover:underline'

/** The newest Beta's version, "2.5.14-beta-4" shown as "2.5.14 Beta 4". */
function useBetaVersion(platform: Platform) {
  const [version, setVersion] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    fetch(`${downloadUrl(platform)}&info=1`)
      .then((response) => (response.ok ? response.json() : null))
      .then((info) => {
        if (live && info?.version) {
          setVersion(String(info.version).replace(/-beta-(\d+)$/, ' Beta $1'))
        }
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [platform])
  return version
}

export default function DownloadPage() {
  const { t, locale } = useI18n()
  const windowsVersion = useBetaVersion('windows')
  const linuxVersion = useBetaVersion('linux')

  const track = (platform: string, channel: string) =>
    trackEvent('download_click', { platform, channel, placement: 'download_page' })

  return (
    <>
      <Head>
        <title>{t('Download Enconvo for Mac, Windows and Linux')}</title>
        <meta
          name="description"
          content={t('Download Enconvo for macOS, or try the Enconvo Beta for Windows and Linux.')}
        />
        <link rel="canonical" href={canonicalUrl('/download', locale)} key="canonical" />
      </Head>
      <div className="min-h-screen bg-canvas text-content">
        <SiteNav />
        <main className="mx-auto max-w-[1080px] px-4 pb-24 pt-32 sm:px-6 sm:pt-40 lg:px-12">
          <section className="max-w-2xl">
            <p className={metaLabel}>{t('Download')}</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl sm:leading-[1.1]">
              {t('Download Enconvo')}
            </h1>
            <p className="mt-5 text-base leading-7 text-content-body sm:text-lg sm:leading-8">
              {t(
                'Enconvo runs on macOS, and Windows and Linux are now in open beta. Sign in with the same Enconvo account everywhere.'
              )}
            </p>
          </section>

          <section id="mac" className={`${card} mt-12 scroll-mt-28`}>
            <div className="flex items-center gap-3">
              <AppleLogoIcon className={cardIcon} />
              <h2 className={cardTitle}>{t('macOS')}</h2>
            </div>
            <p className={requirement}>{t('macOS 14 or later, on Apple Silicon or Intel.')}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href={MAC_ARM_URL}
                onClick={() => track('mac', 'arm64')}
                className={`${primaryButton} w-full sm:w-auto`}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {t('Apple Silicon (.dmg)')}
              </a>
              <a
                href={MAC_INTEL_URL}
                onClick={() => track('mac', 'x64')}
                className={`${secondaryButton} w-full sm:w-auto`}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {t('Intel (.dmg)')}
              </a>
            </div>
          </section>

          <section id="windows" className={`${card} mt-3 scroll-mt-28`}>
            <div className="flex items-center gap-3">
              <WindowsLogoIcon className={cardIcon} />
              <h2 className={cardTitle}>{t('Windows')}</h2>
              <span className={betaTag}>{t('Beta')}</span>
            </div>
            <p className={requirement}>
              {t('Windows 10 (2004) or later, or Windows 11, on 64-bit Intel or AMD.')}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href={downloadUrl('windows')}
                onClick={() => track('windows', 'exe')}
                className={`${primaryButton} w-full sm:w-auto`}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {t('Installer (.exe)')}
              </a>
            </div>
            <p className={meta}>
              {windowsVersion
                ? t('Version {version} · 64-bit', { version: windowsVersion })
                : t('Newest Beta · 64-bit')}
            </p>
            <p className={`${meta} mt-1 max-w-2xl`}>
              {t(
                'If Windows SmartScreen warns you, click More info, then Run anyway. The app updates itself on the Beta channel.'
              )}
            </p>
            <a href={WINDOWS_GUIDE_URL} target="_blank" rel="noreferrer" className={guideLink}>
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              {t('Windows install guide')}
            </a>
          </section>

          <section id="linux" className={`${card} mt-3 scroll-mt-28`}>
            <div className="flex items-center gap-3">
              <LinuxLogoIcon className={cardIcon} />
              <h2 className={cardTitle}>{t('Linux')}</h2>
              <span className={betaTag}>{t('Beta')}</span>
            </div>
            <p className={requirement}>
              {t(
                'Ubuntu 22.04, Debian 12, RHEL 9, Amazon Linux 2023 or newer, on 64-bit Intel or AMD. Runs on a desktop or on a server you use from your browser.'
              )}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href={downloadUrl('linux', 'deb')}
                onClick={() => track('linux', 'deb')}
                className={`${primaryButton} w-full sm:w-auto`}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {t('Debian, Ubuntu (.deb)')}
              </a>
              <a
                href={downloadUrl('linux', 'rpm')}
                onClick={() => track('linux', 'rpm')}
                className={`${secondaryButton} w-full sm:w-auto`}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {t('Fedora, RHEL (.rpm)')}
              </a>
              <a
                href={downloadUrl('linux', 'tar.gz')}
                onClick={() => track('linux', 'tar_gz')}
                className={`${secondaryButton} w-full sm:w-auto`}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {t('Portable (.tar.gz)')}
              </a>
            </div>
            <p className={meta}>
              {linuxVersion
                ? t('Version {version} · 64-bit', { version: linuxVersion })
                : t('Newest Beta · 64-bit')}
            </p>
            <a href={LINUX_GUIDE_URL} target="_blank" rel="noreferrer" className={guideLink}>
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              {t('Linux install guide')}
            </a>
          </section>
        </main>
        <Footer />
      </div>
    </>
  )
}

export const getStaticProps = i18nStaticProps('/download')
