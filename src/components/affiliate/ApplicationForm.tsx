import { I18nText } from '@/i18n/I18nText'
import { useI18n } from '@/i18n/I18nProvider'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { primaryButton, secondaryButton } from '@/components/landing-styles'
import {
  AFFILIATE_TERMS_VERSION,
  affiliateLink,
  applyForAffiliate,
  formatCents,
  isAffiliateCode,
  normalizeAffiliateCode,
  type AffiliateApplication,
  type ProgramTerms,
} from '@/lib/affiliate-program'
import { card, fieldLabel, input, Notice, textarea } from './ui'

const RETURN_URL = encodeURIComponent('/affiliate#apply')

interface Props {
  terms: ProgramTerms
  /** Null while signed out: the form becomes a sign-in prompt. */
  accessToken: string | null
  email: string | null
  /** An earlier application (pending or rejected) to start from. */
  previous: AffiliateApplication | null
  onSubmitted: (application: AffiliateApplication) => void
  onCancel?: () => void
  onSignOut?: () => void
}

/** A code suggestion from the account email, e.g. `ken.moo@x.com` → `kenmoo`. */
function suggestedCode(email: string | null) {
  const local = (email ?? '')
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
  return isAffiliateCode(local) ? local : ''
}

export function ApplicationForm({
  terms,
  accessToken,
  email,
  previous,
  onSubmitted,
  onCancel,
  onSignOut,
}: Props) {
  const { t, locale } = useI18n()

  const [name, setName] = useState(previous?.name ?? '')
  const [website, setWebsite] = useState(previous?.website ?? '')
  const [code, setCode] = useState(previous?.code ?? suggestedCode(email))
  const [audience, setAudience] = useState(previous?.audience ?? '')
  const [plan, setPlan] = useState(previous?.promotion_plan ?? '')
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<{
    field: 'code' | 'form'
    message: string
  } | null>(null)

  const validCode = isAffiliateCode(code)
  const missing = [
    !name.trim() && 'your name',
    !validCode && 'a link code',
    !audience.trim() && 'your audience',
    !plan.trim() && 'your plan',
  ].filter(Boolean) as string[]
  const ready = missing.length === 0 && accepted
  const reapplying = previous?.status === 'rejected'
  const minimum = formatCents(terms.minimum_payout, {
    ...{ cents: false },
    locale,
  })

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!accessToken || !ready || submitting) return
    setSubmitting(true)
    setError(null)
    const result = await applyForAffiliate(accessToken, {
      code,
      name: name.trim(),
      website: website.trim() || undefined,
      audience: audience.trim(),
      promotion_plan: plan.trim(),
      accept_terms: true,
      terms_version: AFFILIATE_TERMS_VERSION,
    })
    setSubmitting(false)
    if (result.ok) onSubmitted(result.data)
    else
      setError({
        field:
          result.reason === 'code_taken' || result.reason === 'invalid_code'
            ? 'code'
            : 'form',
        message: result.message,
      })
  }

  return (
    <section
      id="apply"
      className="grid scroll-mt-28 grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16"
    >
      <div>
        <h2 className="text-3xl font-semibold text-content">
          {reapplying
            ? t('Apply again')
            : previous
            ? t('Update your application')
            : t('Apply')}
        </h2>
        <p className="mt-4 text-base leading-7 text-content-body">
          {t(
            'You apply with your Enconvo account. Your dashboard and payouts are tied to it, so use the account you want to keep.'
          )}
        </p>
        {email && (
          <div className={`mt-6 flex items-center gap-3 ${card} p-4`}>
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-surface-elevated text-sm font-semibold uppercase text-content">
              {email.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-content-muted">
                {t('Signed in as')}
              </div>
              <div className="truncate text-sm text-content">{email}</div>
            </div>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="flex-none text-xs text-content-muted hover:text-content"
              >
                {t('Switch account')}
              </button>
            )}
          </div>
        )}
        <p className="mt-6 text-sm leading-6 text-content-muted">
          {t(
            'We read every application ourselves. Open this page again to see the decision.'
          )}
        </p>
      </div>

      {!accessToken ? (
        <div className={`${card} flex flex-col justify-center p-8`}>
          <h3 className="text-xl font-semibold text-content">
            {t('Sign in to apply')}
          </h3>
          <p className="mt-2 text-sm leading-6 text-content-muted">
            {t(
              'A free Enconvo account is all you need. Already applied? Sign in to see your application or dashboard.'
            )}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/register?returnUrl=${RETURN_URL}`}
              className={primaryButton}
            >
              {t('Create a free account')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href={`/login?returnUrl=${RETURN_URL}`}
              className={secondaryButton}
            >
              {t('Sign in')}
            </Link>
          </div>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className={`${card} space-y-5 p-6 sm:p-8`}
          noValidate
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className={fieldLabel}>{t('Your name')}</span>
              <input
                className={`${input} mt-2`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                autoComplete="name"
                required
              />
            </label>
            <label className="block">
              <span className={fieldLabel}>
                <I18nText
                  source={'Website or channel {p0}'}
                  values={{
                    p0: (
                      <span className="font-normal text-content-muted">
                        {t('(optional)')}
                      </span>
                    ),
                  }}
                />
              </span>
              <input
                className={`${input} mt-2`}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                maxLength={300}
                placeholder={t('youtube.com/@yourchannel')}
                inputMode="url"
              />
            </label>
          </div>

          <label className="block">
            <span className={fieldLabel}>{t('Link code')}</span>
            <div className="mt-2 flex items-center overflow-hidden rounded-lg border border-[#2C3033] bg-[#0B0C0D] focus-within:border-signal-green">
              <span className="flex-none select-none pl-3 font-mono text-sm text-content-muted">
                {t('enconvo.com/?via=')}
              </span>
              <input
                className="h-11 min-w-0 flex-1 bg-transparent pr-3 font-mono text-[15px] text-content placeholder:text-content-ash focus:outline-none"
                value={code}
                onChange={(e) => {
                  // "Ken Moo" → "ken-moo": spaces become dashes and other characters drop out.
                  setCode(
                    normalizeAffiliateCode(
                      e.target.value.replace(/\s+/g, '-')
                    ).replace(/[^a-z0-9_-]/g, '')
                  )
                  if (error?.field === 'code') setError(null)
                }}
                maxLength={32}
                placeholder={t('yourcode')}
                autoCapitalize="none"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={error?.field === 'code' || (!!code && !validCode)}
                aria-describedby="affiliate-code-hint"
                required
              />
            </div>
            <span
              id="affiliate-code-hint"
              className={`mt-2 block text-xs ${
                error?.field === 'code'
                  ? 'text-signal-red'
                  : validCode
                  ? 'text-signal-green'
                  : 'text-content-muted'
              }`}
            >
              {error?.field === 'code'
                ? t(error.message)
                : validCode
                ? t('Your link: {p0}', { p0: affiliateLink(code) })
                : t(
                    '3 to 32 lowercase letters, digits, - or _, starting with a letter or digit. It appears in your link.'
                  )}
            </span>
          </label>

          <label className="block">
            <span className={fieldLabel}>{t('Who is your audience?')}</span>
            <textarea
              className={`${textarea} mt-2`}
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              maxLength={500}
              placeholder={t(
                'e.g. 40k newsletter subscribers who buy productivity apps'
              )}
              required
            />
          </label>

          <label className="block">
            <span className={fieldLabel}>
              {t('How will you promote Enconvo?')}
            </span>
            <textarea
              className={`${textarea} mt-2`}
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              maxLength={2000}
              placeholder={t(
                'e.g. a review video, then a mention in my monthly tools roundup'
              )}
              required
            />
          </label>

          <label className="flex items-start gap-3 text-sm leading-6 text-content-body">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 flex-none rounded border-white/20 bg-[#0B0C0D] text-signal-green focus:ring-1 focus:ring-signal-green/60 focus:ring-offset-0"
            />
            <span>
              {t('I agree to the')}{' '}
              <Link
                href="/affiliate/terms"
                target="_blank"
                className="text-signal-blue hover:underline"
              >
                {t('Affiliate program terms')}
              </Link>
              : {terms.commission_rate}
              {t('% of what customers pay before tax, payable after the ')}
              {terms.hold_days}
              {t('-day refund window, paid monthly from ')}
              {minimum}.
            </span>
          </label>

          {error?.field === 'form' && (
            <Notice tone="error" title={t("We couldn't send your application")}>
              {t(error.message)}
            </Notice>
          )}

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={!ready || submitting}
              className={`${primaryButton} flex-none whitespace-nowrap`}
            >
              {submitting ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  {t('Sending…')}
                </>
              ) : previous && !reapplying ? (
                t('Save changes')
              ) : (
                t('Submit application')
              )}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className={secondaryButton}
              >
                {t('Cancel')}
              </button>
            )}
            {!ready && !submitting && (
              <span className="text-xs leading-5 text-content-muted">
                {missing.length
                  ? t('Add {p0}{p1}.', {
                      p0:
                        missing.length > 1
                          ? `${missing.slice(0, -1).join(', ')} and ${
                              missing[missing.length - 1]
                            }`
                          : missing[0],
                      p1: accepted ? '' : ', then accept the terms',
                    })
                  : t('Accept the terms to continue.')}
              </span>
            )}
          </div>
        </form>
      )}
    </section>
  )
}
