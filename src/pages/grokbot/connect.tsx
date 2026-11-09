import { I18nText } from '@/i18n/I18nText'
import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { AlertCircle, ArrowRight, Check, Loader2, ShieldAlert } from 'lucide-react'
import { Footer } from '@/components/Footer'
import { metaLabel, primaryButton, secondaryButton } from '@/components/landing-styles'
import { SiteNav } from '@/components/SiteNav'
import { supabase } from '@/lib/supabase'
import {
  answerGrokBotRequest,
  inspectGrokBotRequest,
  type GrokBotConnectRequest,
} from '@/lib/grokbot-connect'

// Grok Bot's OAuth consent page: its connector sign-in comes here, and the signed-in account lets it reach Enconvo
// on the Mac it connected Grok Bot from, or sends it away.

const UNUSABLE: Record<string, string> = {
  request_expired: 'This connection request expired. Start connecting from Grok Bot again.',
  invalid_request: "This link isn't a valid connection request. Start connecting from Grok Bot again.",
}

// The page's own words for the Worker's other refusals, by their code: the Worker's message is English only.
const GENERIC_ERROR = 'Something went wrong. Please try again.'
const REFUSED: Record<string, string> = {
  network_error: 'Could not reach Enconvo. Check your connection and try again.',
  unavailable: "Grok Bot sign-in isn't available right now. Try again in a few minutes.",
}

function Notice({
  tone,
  title,
  children,
}: {
  tone: 'warning' | 'error'
  title: string
  children: React.ReactNode
}) {
  const Icon = tone === 'warning' ? ShieldAlert : AlertCircle
  return (
    <div
      role={tone === 'error' ? 'alert' : 'note'}
      className="mt-8 flex max-w-xl items-start gap-3 rounded-lg border border-hairline bg-surface-card p-4"
    >
      <Icon className="mt-0.5 h-5 w-5 flex-none text-signal-yellow" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-content">{title}</p>
        <div className="mt-1 text-sm leading-6 text-content-muted">{children}</div>
      </div>
    </div>
  )
}

export default function GrokBotConnectPage() {
  const { t } = useI18n()
  const router = useRouter()
  const request = typeof router.query.request === 'string' ? router.query.request : ''

  const [email, setEmail] = useState<string | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [details, setDetails] = useState<GrokBotConnectRequest | null>(null)
  const [unusable, setUnusable] = useState<string | null>(null)
  const [busy, setBusy] = useState<'load' | 'approve' | 'deny' | 'leaving' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const returnUrl = encodeURIComponent(`/grokbot/connect?request=${encodeURIComponent(request)}`)

  useEffect(() => {
    let cancelled = false
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setEmail(data.session?.user.email ?? null)
      setSessionChecked(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null)
    })
    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  const refused = useCallback((status: number, reason: string) => {
    if (status === 401) setEmail(null)
    else if (UNUSABLE[reason]) setUnusable(UNUSABLE[reason])
    else if (reason === 'no_mac') setDetails((current) => (current ? { ...current, mac: null } : current))
    else setError(REFUSED[status === 0 ? 'network_error' : reason] ?? GENERIC_ERROR)
  }, [])

  const load = useCallback(async () => {
    setError(null)
    setBusy('load')
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      setEmail(null)
      setBusy(null)
      return
    }
    const result = await inspectGrokBotRequest(data.session.access_token, request)
    setBusy(null)
    if (result.ok) setDetails(result.data)
    else refused(result.status, result.reason)
  }, [request, refused])

  useEffect(() => {
    setDetails(null)
    setUnusable(null)
    setError(null)
    if (!request || !email) return
    void load()
  }, [request, email, load])

  async function decide(approve: boolean) {
    setError(null)
    setBusy(approve ? 'approve' : 'deny')
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      setEmail(null)
      setBusy(null)
      return
    }
    const result = await answerGrokBotRequest(data.session.access_token, request, approve)
    if (result.ok) {
      setBusy('leaving')
      window.location.assign(result.data.redirect)
      return
    }
    setBusy(null)
    refused(result.status, result.reason)
  }

  const macName = details?.mac?.name || t('Your Mac')

  let content: React.ReactNode
  if (!router.isReady || !sessionChecked) {
    content = <Loader2 className="h-6 w-6 animate-spin text-content-muted" aria-label={t('Loading')} />
  } else if (!request || unusable) {
    content = (
      <>
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-content-muted" aria-hidden="true" />
          <span className={metaLabel}>{t('Connect Grok Bot')}</span>
        </div>
        <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl sm:leading-[1.1]">
          {t("This link can't be used")}
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-content-body">
          {t(unusable ?? UNUSABLE.invalid_request)}
        </p>
      </>
    )
  } else if (!email) {
    content = (
      <>
        <p className={metaLabel}>{t('Connect Grok Bot')}</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl sm:leading-[1.1]">
          {t('Sign in to connect Grok Bot')}
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-content-body">
          {t('Sign in to the Enconvo account whose Mac Grok Bot should reach.')}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={`/login?returnUrl=${returnUrl}`} className={primaryButton}>
            {t('Sign in')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href={`/register?returnUrl=${returnUrl}`} className={secondaryButton}>
            {t('Create your account')}
          </Link>
        </div>
      </>
    )
  } else if (!details) {
    content = error ? (
      <Notice tone="error" title={t("Couldn't load the connection request")}>
        {t(error)}
      </Notice>
    ) : (
      <Loader2 className="h-6 w-6 animate-spin text-content-muted" aria-label={t('Loading')} />
    )
  } else if (!details.mac) {
    content = (
      <>
        <p className={metaLabel}>{t('Connect Grok Bot')}</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl sm:leading-[1.1]">
          {t('Connect your Mac first')}
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-content-body">
          {t(
            "Open Enconvo on the Mac Grok Bot should reach, go to Grok Bot's settings, and choose Connect. Then try again here."
          )}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => void load()} disabled={!!busy} className={primaryButton}>
            {busy === 'load' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {t('Try again')}
          </button>
          <button type="button" onClick={() => void decide(false)} disabled={!!busy} className={secondaryButton}>
            {t('Deny')}
          </button>
        </div>
      </>
    )
  } else {
    const abilities = [
      'Add replies and new messages to your Grok Bot chats',
      'Show notifications on your Mac',
      'List your agents, and send them requests you approve on your Mac',
    ]
    content = (
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-start lg:gap-16">
        <div>
          <p className={metaLabel}>{t('Connect Grok Bot')}</p>
          <h1 className="mt-4 max-w-xl break-words text-4xl font-semibold leading-tight sm:text-5xl sm:leading-[1.1]">
            {details.client === 'grok_bot'
              ? t('Grok Bot wants to connect to Enconvo')
              : details.client_name
              ? t('{name} ({host}) wants to connect to Enconvo', { name: details.client_name, host: details.redirect_host })
              : t('An app on this computer ({host}) wants to connect to Enconvo', { host: details.redirect_host })}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-content-body">
            {t('Approving lets it use Enconvo on your Mac to:')}
          </p>
          <ul className="mt-4 max-w-xl space-y-2 text-base leading-7 text-content-body">
            {abilities.map((ability) => (
              <li key={ability} className="flex items-start gap-3">
                <Check className="mt-1.5 h-4 w-4 flex-none text-signal-green" aria-hidden="true" />
                <span>{t(ability)}</span>
              </li>
            ))}
          </ul>

          <Notice tone="warning" title={t('Only approve a connection you started')}>
            {t(
              "If someone sent you this link, deny it. You can disconnect Grok Bot at any time in Grok Bot's settings in Enconvo."
            )}
          </Notice>
          {error && (
            <Notice tone="error" title={t("Couldn't answer the request")}>
              {t(error)}
            </Notice>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => void decide(true)} disabled={!!busy} className={primaryButton}>
              {busy === 'approve' || busy === 'leaving' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {t('Approve')}
            </button>
            <button type="button" onClick={() => void decide(false)} disabled={!!busy} className={secondaryButton}>
              {busy === 'deny' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {t('Deny')}
            </button>
          </div>
          <p className="mt-4 text-sm text-content-muted">
            <I18nText source={'Approving as {p0}.'} values={{ p0: <span className="text-content">{email}</span> }} />{' '}
            <button
              type="button"
              onClick={() => void supabase.auth.signOut({ scope: 'local' })}
              className="text-content underline decoration-hairline-strong underline-offset-4"
            >
              {t('Use another account')}
            </button>
          </p>
        </div>

        <div className="rounded-[10px] border border-hairline-strong bg-surface-elevated p-6">
          <h2 className={metaLabel}>{t('The connection')}</h2>
          <dl className="mt-5 divide-y divide-hairline text-sm">
            <div className="flex items-baseline justify-between gap-4 pb-4">
              <dt className="text-content-muted">{t('Reaches')}</dt>
              <dd className="min-w-0 break-words text-right font-semibold text-content">{macName}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-4">
              <dt className="text-content-muted">{t('Account')}</dt>
              <dd className="min-w-0 break-words text-right text-content">{email}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 pt-4">
              <dt className="text-content-muted">{t('Returns to')}</dt>
              <dd className="min-w-0 break-words text-right font-mono text-content">{details.redirect_host}</dd>
            </div>
          </dl>
          <p className="mt-5 text-xs leading-5 text-content-ash">
            {t(
              'Grok Bot reaches the Mac you connected it from in Enconvo. To use another Mac, connect Grok Bot from that Mac.'
            )}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{t('Connect Grok Bot - Enconvo')}</title>
        <meta name="description" content={t("Approve Grok Bot's connection to Enconvo on your Mac.")} />
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen bg-canvas text-content">
        <SiteNav />
        <main className="mx-auto max-w-[1240px] px-6 pb-24 pt-36 lg:px-12">{content}</main>
        <Footer />
      </div>
    </>
  )
}

export const getStaticProps = i18nStaticProps('/grokbot/connect')
