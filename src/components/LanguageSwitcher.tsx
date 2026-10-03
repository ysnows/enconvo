import { useState } from 'react'
import { useRouter } from 'next/router'
import { Globe } from 'lucide-react'
import { useI18n } from '@/i18n/I18nProvider'
import { locales, localeNames, getLocale, rememberLocale } from '@/i18n/locale'
import { trackEvent } from '@/lib/analytics'

export function LanguageSwitcher({
  placement = 'navigation',
}: {
  placement?: 'navigation' | 'page' | 'footer'
}) {
  const router = useRouter()
  const { locale, t } = useI18n()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  async function changeLanguage(value: string) {
    const next = getLocale(value)
    if (next === locale || busy) return
    setBusy(true)
    setError(false)
    try {
      // Auth return URLs carry a language hint. Keep it in sync so the auth
      // page's initial-language effect cannot undo an explicit choice.
      const query = { ...router.query }
      let asPath = router.asPath
      if (typeof query.language === 'string') {
        query.language = next
        asPath = asPath.replace(
          /([?&])language(?:=[^&#]*)?(?=&|#|$)/g,
          `$1language=${next}`
        )
      }
      // Using asPath preserves query strings, dynamic path values and the hash.
      const changed = await router.push(
        { pathname: router.pathname, query },
        asPath,
        { locale: next, scroll: false }
      )
      if (changed) {
        rememberLocale(next)
        trackEvent(
          'website_language_changed',
          { previous_language: locale, language: next, placement },
          { includePagePath: false }
        )
      }
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="relative">
      <label className="flex min-h-[40px] items-center gap-1.5 rounded-[10px] border border-white/10 bg-[#141A22]/90 px-2.5 text-[12px] text-[#F4F7FB] backdrop-blur-md focus-within:ring-2 focus-within:ring-blue-500/60">
        <Globe size={14} aria-hidden="true" />
        <span className="sr-only">{t('Language')}</span>
        <select
          aria-label={t('Language')}
          onFocus={() =>
            trackEvent(
              'website_language_picker_opened',
              { language: locale, placement },
              { includePagePath: false }
            )
          }
          value={locale}
          disabled={busy}
          onChange={(event) => void changeLanguage(event.target.value)}
          className="max-w-[104px] cursor-pointer border-0 bg-transparent py-1 pl-0 pr-6 text-[12px] text-[#F4F7FB] focus:ring-0 disabled:cursor-wait"
        >
          {locales.map((language) => (
            <option
              key={language}
              value={language}
              lang={language}
              className="bg-[#141A22]"
            >
              {localeNames[language]}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p
          role="alert"
          className="absolute right-0 mt-2 w-48 rounded-[10px] bg-[#202832] p-3 text-xs text-[#F4F7FB]"
        >
          {t('Could not change language. Please try again.')}
        </p>
      )}
    </div>
  )
}
