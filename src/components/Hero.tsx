import { localizePath } from '@/i18n/locale'
import Link from 'next/link'
import {
  AppleLogoIcon,
  LinuxLogoIcon,
  WindowsLogoIcon,
} from '@/components/PlatformIcons'
import { useI18n } from '@/i18n/I18nProvider'
import { I18nText } from '@/i18n/I18nText'
import styles from '@/styles/Home.module.css'
import { useEffect, useState } from 'react'
import { Menu } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { SiteNav } from '@/components/SiteNav'
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

function DownloadRowArrow() {
  return (
    <svg
      className="h-4 w-4 text-content-ash transition-colors group-hover:text-content-muted"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 10v6m0 0l-3-3m3 3l3-3"
      />
    </svg>
  )
}

export function Hero() {
  const { t, locale } = useI18n()

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
    >
      <HeroLayout />
      <HeroBackdrop />
      <SiteNav />

      <div className={styles.heroContent}>
        <div className={styles.heroInner}>
          <div className="w-full">
            <div className={styles.heroCopy}>
              <h1 className={styles.heroTitle}>
                <I18nText
                  source="The assistant your {mac} was promised."
                  values={{
                    mac: <span className={styles.heroTitleAccent}>Mac</span>,
                  }}
                />
              </h1>

              <p className={styles.heroDescription}>
                {t(
                  'Enconvo is an AI agent that lives across your Mac — it sees your screen, works inside your apps, and actually gets things done.'
                )}
              </p>

              <div className={styles.heroActions}>
                <Menu as="div" className="relative">
                  <Menu.Button
                    className={`${styles.downloadButton} group inline-flex items-center justify-center bg-white font-semibold text-canvas hover:bg-content`}
                  >
                    <svg
                      className="mr-2 h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                      />
                    </svg>
                    <span>{t('Download')}</span>
                    <ChevronDownIcon className="ml-2 h-4 w-4" />
                  </Menu.Button>

                  <Menu.Items
                    className={`${styles.downloadMenu} absolute top-full z-50 mt-2 bg-surface-elevated shadow-2xl ring-1 ring-hairline focus:outline-none`}
                  >
                    <div className="p-3">
                      <div className="space-y-1">
                        <Menu.Item>
                          {({ active }) => (
                            <a
                              href="https://api.enconvo.com/app/download?arch=arm64&platform=darwin"
                              onClick={() =>
                                trackEvent('download_click', {
                                  arch: 'arm64',
                                  placement: 'hero',
                                })
                              }
                              target="_blank"
                              rel="noreferrer"
                              className={`${
                                active ? 'bg-surface-card' : ''
                              } group flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium text-content transition-colors`}
                            >
                              <div className="flex w-full items-center justify-between">
                                <div className="flex items-center">
                                  <AppleLogoIcon className="mr-3 h-5 w-5 text-content-muted" />
                                  <div>
                                    <div className="text-start font-medium text-content">
                                      {t('macOS (Apple Silicon)')}
                                    </div>
                                    <div className="text-start text-xs text-content-ash">
                                      {t('For Macs with an Apple chip')}
                                    </div>
                                  </div>
                                </div>
                                <DownloadRowArrow />
                              </div>
                            </a>
                          )}
                        </Menu.Item>

                        <Menu.Item>
                          {({ active }) => (
                            <a
                              href="https://api.enconvo.com/app/download?arch=x64&platform=darwin"
                              onClick={() =>
                                trackEvent('download_click', {
                                  arch: 'x64',
                                  placement: 'hero',
                                })
                              }
                              target="_blank"
                              rel="noreferrer"
                              className={`${
                                active ? 'bg-surface-card' : ''
                              } group flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium text-content transition-colors`}
                            >
                              <div className="flex w-full items-center justify-between">
                                <div className="flex items-center">
                                  <AppleLogoIcon className="mr-3 h-5 w-5 text-content-muted" />
                                  <div>
                                    <div className="text-start font-medium text-content">
                                      {t('macOS (Intel)')}
                                    </div>
                                    <div className="text-start text-xs text-content-ash">
                                      {t('For Intel-based Macs')}
                                    </div>
                                  </div>
                                </div>
                                <DownloadRowArrow />
                              </div>
                            </a>
                          )}
                        </Menu.Item>
                        <div className="mx-4 my-1 border-t border-hairline" />
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href={localizePath('/download#windows', locale)}
                              onClick={() =>
                                trackEvent('download_click', {
                                  platform: 'windows',
                                  placement: 'hero',
                                })
                              }
                              className={`${
                                active ? 'bg-surface-card' : ''
                              } group flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium text-content transition-colors`}
                            >
                              <div className="flex w-full items-center justify-between">
                                <div className="flex items-center">
                                  <WindowsLogoIcon className="mr-3 h-5 w-5 text-content-muted" />
                                  <div>
                                    <div className="text-start font-medium text-content">
                                      {t('Windows (Beta)')}
                                    </div>
                                    <div className="text-start text-xs text-content-ash">
                                      {t('For Windows 10 and 11 (64-bit)')}
                                    </div>
                                  </div>
                                </div>
                                <DownloadRowArrow />
                              </div>
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href={localizePath('/download#linux', locale)}
                              onClick={() =>
                                trackEvent('download_click', {
                                  platform: 'linux',
                                  placement: 'hero',
                                })
                              }
                              className={`${
                                active ? 'bg-surface-card' : ''
                              } group flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium text-content transition-colors`}
                            >
                              <div className="flex w-full items-center justify-between">
                                <div className="flex items-center">
                                  <LinuxLogoIcon className="mr-3 h-5 w-5 text-content-muted" />
                                  <div>
                                    <div className="text-start font-medium text-content">
                                      {t('Linux (Beta)')}
                                    </div>
                                    <div className="text-start text-xs text-content-ash">
                                      {t('For Ubuntu, Debian and Fedora')}
                                    </div>
                                  </div>
                                </div>
                                <DownloadRowArrow />
                              </div>
                            </Link>
                          )}
                        </Menu.Item>
                      </div>
                    </div>
                  </Menu.Items>
                </Menu>

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
