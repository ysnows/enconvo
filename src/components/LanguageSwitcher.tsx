import { Fragment, useEffect, useState, type MouseEvent } from 'react'
import { useRouter, type NextRouter } from 'next/router'
import { Menu, Transition } from '@headlessui/react'
import { Check } from 'lucide-react'
import { useI18n } from '@/i18n/I18nProvider'
import {
  locales,
  localeNames,
  localeShortNames,
  getLocale,
  localizePath,
  rememberLocale,
  type Locale,
} from '@/i18n/locale'
import { trackEvent } from '@/lib/analytics'

type Placement = 'navigation' | 'page' | 'footer'
/** link: text in the nav row; touch: the phone nav, beside the menu button; boxed: a corner control. */
type Look = 'link' | 'touch' | 'boxed'
type PageRouter = Pick<NextRouter, 'pathname' | 'query' | 'asPath' | 'push'>

/**
 * The current page in another language. Auth return URLs carry a language hint; keep it in
 * sync so the auth page's initial-language effect cannot undo an explicit choice.
 */
function pageIn(router: Pick<NextRouter, 'query' | 'asPath'>, next: Locale) {
  const query = { ...router.query }
  let asPath = router.asPath
  if (typeof query.language === 'string') {
    query.language = next
    asPath = asPath.replace(
      /([?&])language(?:=[^&#]*)?(?=&|#|$)/g,
      `$1language=${next}`
    )
  }
  return { query, asPath }
}

/** Moves the page to another language; resolves true once it changed. */
export async function switchLanguage(
  router: PageRouter,
  current: Locale,
  value: string,
  placement: Placement
) {
  const next = getLocale(value)
  if (next === current) return false
  const { query, asPath } = pageIn(router, next)
  // Using asPath preserves query strings, dynamic path values and the hash.
  const changed = await router.push(
    { pathname: router.pathname, query },
    asPath,
    { locale: next, scroll: false }
  )
  if (!changed) return false
  rememberLocale(next)
  trackEvent(
    'website_language_changed',
    { previous_language: current, language: next, placement },
    { includePagePath: false }
  )
  return true
}

/** Mounted with the open menu, so each opening counts once, by pointer or keyboard. */
function PickerOpened({
  language,
  placement,
}: {
  language: Locale
  placement: Placement
}) {
  useEffect(() => {
    trackEvent(
      'website_language_picker_opened',
      { language, placement },
      { includePagePath: false }
    )
  }, [language, placement])
  return null
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 disabled:cursor-wait disabled:opacity-60'

function triggerClass(look: Look, open: boolean) {
  if (look === 'boxed')
    return `flex min-h-[40px] min-w-[40px] items-center justify-center rounded-[10px] border px-3 text-[13px] font-semibold leading-[18px] text-[#F4F7FB] backdrop-blur-md transition-colors hover:bg-[#202832] ${
      open
        ? 'border-white/25 bg-[#202832]'
        : 'border-white/10 bg-[#141A22]/90'
    } ${focusRing}`
  if (look === 'touch')
    return `inline-flex h-11 min-w-[44px] items-center justify-center rounded-[10px] px-2.5 text-[15px] font-semibold transition-colors ${
      open ? 'bg-white/[0.08] text-content' : 'text-content-body'
    } ${focusRing}`
  return `-mx-2 -my-1 inline-flex h-8 items-center rounded-lg px-2 text-sm font-medium leading-6 transition-colors hover:text-content ${
    open ? 'bg-white/[0.08] text-content' : 'text-content-body'
  } ${focusRing}`
}

export function LanguageSwitcher({
  placement = 'navigation',
  look = placement === 'page' ? 'boxed' : 'link',
}: {
  placement?: Placement
  look?: Look
}) {
  const router = useRouter()
  const { locale, t } = useI18n()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  async function changeLanguage(value: Locale) {
    if (busy) return
    setBusy(true)
    setError(false)
    try {
      await switchLanguage(router, locale, value, placement)
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  function choose(event: MouseEvent, value: Locale, close: () => void) {
    // A new tab or window follows the link itself.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    close()
    void changeLanguage(value)
  }

  return (
    <Menu as="div" className="relative">
      {({ open }) => (
        <>
          <Menu.Button
            aria-label={`${t('Language')}: ${localeNames[locale]}`}
            disabled={busy}
            className={triggerClass(look, open)}
          >
            <span lang={locale}>{localeShortNames[locale]}</span>
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition duration-100 ease-out"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition duration-75 ease-in"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Menu.Items
              className={`absolute right-0 top-full z-50 mt-2 max-h-[calc(100dvh-7rem)] origin-top-right overflow-y-auto rounded-[14px] border border-white/10 bg-[#101417] p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_2px_8px_rgba(0,0,0,0.4)] focus:outline-none ${
                look === 'touch' ? 'w-[232px]' : 'w-52'
              }`}
            >
              <PickerOpened language={locale} placement={placement} />
              {locales.map((language) => {
                const current = language === locale
                return (
                  <Menu.Item key={language}>
                    {({ active, close }) => (
                      <a
                        href={localizePath(
                          pageIn(router, language).asPath,
                          language
                        )}
                        lang={language}
                        hrefLang={language}
                        aria-current={current ? 'true' : undefined}
                        onClick={(event) => choose(event, language, close)}
                        className={`flex items-center justify-between gap-3 rounded-lg px-2.5 transition-colors ${
                          look === 'touch' ? 'h-11 text-base' : 'h-9 text-sm'
                        } ${
                          active
                            ? 'bg-white/[0.06] text-content'
                            : current
                            ? 'text-content'
                            : 'text-content-body'
                        } ${current ? 'font-medium' : ''}`}
                      >
                        <span>{localeNames[language]}</span>
                        {current && (
                          <Check
                            className="h-4 w-4 shrink-0 text-content"
                            aria-hidden="true"
                          />
                        )}
                      </a>
                    )}
                  </Menu.Item>
                )
              })}
            </Menu.Items>
          </Transition>
          {error && (
            <p
              role="alert"
              className="absolute right-0 top-full mt-2 w-48 rounded-[10px] bg-[#202832] p-3 text-xs text-[#F4F7FB]"
            >
              {t('Could not change language. Please try again.')}
            </p>
          )}
        </>
      )}
    </Menu>
  )
}
