import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

import {
  AppleLogoIcon,
  LinuxLogoIcon,
  WindowsLogoIcon,
} from '@/components/PlatformIcons'
import { useI18n } from '@/i18n/I18nProvider'
import { localizePath } from '@/i18n/locale'
import { trackEvent } from '@/lib/analytics'
import styles from '@/styles/Home.module.css'

type MacArch = 'arm64' | 'x64'

const MAC_DOWNLOAD_URL: Record<MacArch, string> = {
  arm64: 'https://api.enconvo.com/app/download?arch=arm64&platform=darwin',
  x64: 'https://api.enconvo.com/app/download?arch=x64&platform=darwin',
}

/**
 * Which Mac the visitor is on. Chromium browsers report the CPU architecture
 * through User-Agent Client Hints; Firefox names the GPU, which tells an Apple
 * chip from Intel or AMD graphics. Safari reports neither, so it keeps the
 * Apple Silicon default without claiming to have detected it.
 */
async function detectMacArch(): Promise<MacArch | null> {
  const nav = navigator as Navigator & {
    userAgentData?: {
      getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string }>
    }
  }
  // iPads also say "Macintosh"; they are the ones with a touch screen.
  const isMac =
    /Macintosh|Mac OS X/.test(nav.userAgent) && (nav.maxTouchPoints ?? 0) < 2
  if (!isMac) return null

  try {
    const hints = await nav.userAgentData?.getHighEntropyValues?.(['architecture'])
    if (hints?.architecture === 'arm') return 'arm64'
    if (hints?.architecture === 'x86') return 'x64'
  } catch {}

  try {
    const gl = document.createElement('canvas').getContext('webgl')
    const info = gl?.getExtension('WEBGL_debug_renderer_info')
    const renderer = info
      ? String(gl!.getParameter(info.UNMASKED_RENDERER_WEBGL))
      : ''
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    if (/Apple M\d/i.test(renderer)) return 'arm64'
    if (/Intel|AMD|Radeon/i.test(renderer)) return 'x64'
  } catch {}

  return null
}

function useMacArch() {
  const [detected, setDetected] = useState<MacArch | null>(null)
  useEffect(() => {
    let cancelled = false
    const run = () => {
      detectMacArch().then((arch) => {
        if (!cancelled) setDetected(arch)
      })
    }
    const idle = (window as any).requestIdleCallback as
      | ((cb: () => void) => number)
      | undefined
    const handle = idle ? idle(run) : window.setTimeout(run, 300)
    return () => {
      cancelled = true
      if (idle) (window as any).cancelIdleCallback?.(handle)
      else window.clearTimeout(handle)
    }
  }, [])
  return { arch: detected ?? ('arm64' as MacArch), detected: detected !== null }
}

function DownloadGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 20h14" />
    </svg>
  )
}

function ChevronGlyph() {
  return (
    <svg
      className="h-3.5 w-3.5 text-content-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

export function HeroDownloadMenu({ macVersion }: { macVersion?: string }) {
  const { t, locale } = useI18n()
  const { arch, detected } = useMacArch()
  const other: MacArch = arch === 'arm64' ? 'x64' : 'arm64'
  const chipName = (a: MacArch) =>
    a === 'arm64' ? t('Apple Silicon') : t('Intel')

  const trackMac = (a: MacArch) =>
    trackEvent('download_click', { arch: a, placement: 'hero' })
  const trackPlatform = (platform: 'windows' | 'linux') =>
    trackEvent('download_click', { platform, placement: 'hero' })

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className={`${styles.downloadButton} group inline-flex items-center justify-center bg-white font-semibold text-canvas hover:bg-content`}
      >
        <svg
          className="mr-2 h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
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
        className={`${styles.downloadMenu} absolute top-full z-50 mt-2 flex flex-col gap-1 bg-surface-elevated p-2 text-start shadow-2xl ring-1 ring-hairline-strong focus:outline-none`}
      >
        <div className="flex flex-col gap-4 rounded-[10px] border border-hairline bg-surface-card p-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-hairline-strong bg-canvas">
              <AppleLogoIcon className="h-6 w-6 text-content" />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-[17px] font-semibold leading-[22px] text-content">
                {t('Enconvo for Mac')}
              </span>
              {detected ? (
                <span className="inline-flex h-5 w-fit items-center gap-1.5 rounded-md bg-signal-green/10 px-2 text-xs font-medium text-signal-green">
                  <span className="h-1.5 w-1.5 rounded-full bg-signal-green" />
                  {t('Your Mac · {chip}', { chip: chipName(arch) })}
                </span>
              ) : (
                <span className="text-[13px] leading-[18px] text-content-muted">
                  {t('Apple Silicon · M1 and later')}
                </span>
              )}
            </div>
          </div>

          <Menu.Item>
            {({ active }) => (
              <a
                href={MAC_DOWNLOAD_URL[arch]}
                onClick={() => trackMac(arch)}
                target="_blank"
                rel="noreferrer"
                className={`${
                  active ? 'bg-content' : 'bg-white'
                } flex h-[46px] items-center justify-center gap-2.5 rounded-lg text-[15px] font-semibold text-canvas transition-colors`}
              >
                <DownloadGlyph className="h-[18px] w-[18px]" />
                <span>
                  {arch === 'arm64'
                    ? t('Download for Apple Silicon')
                    : t('Download for Intel')}
                </span>
              </a>
            )}
          </Menu.Item>

          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs leading-4 text-content-muted">
            {macVersion ? (
              <>
                <span>v{macVersion}</span>
                <span className="h-[3px] w-[3px] rounded-full bg-content-ash" />
              </>
            ) : null}
            <span>{t('macOS 14 or later')}</span>
            <span className="h-[3px] w-[3px] rounded-full bg-content-ash" />
            <Menu.Item>
              {({ active }) => (
                <Link
                  href={localizePath('/changelog', locale)}
                  prefetch={false}
                  className={`${
                    active ? 'text-content' : 'text-content-body'
                  } underline decoration-white/25 underline-offset-[3px]`}
                >
                  {t('What’s new')}
                </Link>
              )}
            </Menu.Item>
          </div>
        </div>

        <Menu.Item>
          {({ active }) => (
            <a
              href={MAC_DOWNLOAD_URL[other]}
              onClick={() => trackMac(other)}
              target="_blank"
              rel="noreferrer"
              className={`${
                active ? 'bg-white/[0.06]' : ''
              } flex min-h-[44px] items-center gap-3 rounded-[10px] px-4 py-2 text-sm text-content-body transition-colors`}
            >
              <span className="flex-1">
                {other === 'x64'
                  ? t('On an Intel Mac?')
                  : t('On an Apple Silicon Mac?')}{' '}
                <span className="font-medium text-content">
                  {other === 'x64'
                    ? t('Get the Intel version')
                    : t('Get the Apple Silicon version')}
                </span>
              </span>
              <DownloadGlyph className="h-4 w-4 shrink-0" />
            </a>
          )}
        </Menu.Item>

        <div className="mx-3 my-0.5 h-px bg-hairline" />

        <div className="flex items-center justify-between px-4 pb-1 pt-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-content-muted">
            {t('Other platforms')}
          </span>
          <span className="rounded-[5px] border border-hairline px-1.5 text-[11px] font-semibold uppercase leading-4 text-content-muted">
            {t('Beta')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 px-2 pb-2 pt-1">
          <Menu.Item>
            {({ active }) => (
              <Link
                href={localizePath('/download#windows', locale)}
                onClick={() => trackPlatform('windows')}
                className={`${
                  active ? 'bg-white/[0.06]' : ''
                } flex h-12 items-center gap-2.5 rounded-[10px] border border-hairline px-3 text-sm font-medium text-content-body transition-colors`}
              >
                <WindowsLogoIcon className="h-[18px] w-[18px] shrink-0" />
                <span className="flex-1">Windows</span>
                <ChevronGlyph />
              </Link>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <Link
                href={localizePath('/download#linux', locale)}
                onClick={() => trackPlatform('linux')}
                className={`${
                  active ? 'bg-white/[0.06]' : ''
                } flex h-12 items-center gap-2.5 rounded-[10px] border border-hairline px-3 text-sm font-medium text-content-body transition-colors`}
              >
                <LinuxLogoIcon className="h-[18px] w-[18px] shrink-0" />
                <span className="flex-1">Linux</span>
                <ChevronGlyph />
              </Link>
            )}
          </Menu.Item>
        </div>
      </Menu.Items>
    </Menu>
  )
}
