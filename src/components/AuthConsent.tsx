import Link from 'next/link'
import { I18nText } from '@/i18n/I18nText'
import { useI18n } from '@/i18n/I18nProvider'
import { MINIMUM_AGE } from '@/lib/age-gate'

export const CONSENT_LINE =
  'By continuing, you confirm you’re at least {p0} and agree to our {p1} and {p2}.'

const linkClass =
  'text-[#888888] underline underline-offset-2 hover:text-[#999999]'

/**
 * The consent line under the sign-up and log-in buttons: the age the Terms set and the Terms
 * themselves (lib/age-gate). Continuing with email, Apple or Google gives it.
 */
export function AuthConsent({ className = '' }: { className?: string }) {
  const { t } = useI18n()
  return (
    <p className={`text-center text-xs leading-5 text-[#666666] ${className}`}>
      <I18nText
        source={CONSENT_LINE}
        values={{
          p0: String(MINIMUM_AGE),
          p1: (
            <Link href="/terms" className={linkClass}>
              {t('Terms of Service')}
            </Link>
          ),
          p2: (
            <Link href="/privacy" className={linkClass}>
              {t('Privacy Policy')}
            </Link>
          ),
        }}
      />
    </p>
  )
}
