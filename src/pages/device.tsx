import { I18nText } from '@/i18n/I18nText'
import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { useEffect, useState, type FormEvent } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Loader2,
  ShieldAlert,
} from 'lucide-react'
import { Footer } from '@/components/Footer'
import {
  metaLabel,
  primaryButton,
  secondaryButton,
} from '@/components/landing-styles'
import { SiteNav } from '@/components/SiteNav'
import { supabase } from '@/lib/supabase'
import {
  answerDeviceRequest,
  inspectDeviceRequest,
  normalizeUserCode,
  type DeviceRequest,
} from '@/lib/device-code'

// The page `enconvo login` sends people to: it shows what asked to sign in and
// lets the signed-in account approve or deny it.

/** Why a code can't be answered, in the page's words. */
const UNUSABLE: Record<string, string> = {
  code_not_found:
    "This code isn't valid or has expired. Run enconvo login on your device again for a new one.",
  already_decided: 'This sign-in request has already been answered.',
}

const CODE_HINT = 'Codes have 8 letters, like BCDF-GHJK.'

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
      <Icon
        className="mt-0.5 h-5 w-5 flex-none text-signal-yellow"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-content">{title}</p>
        <p className="mt-1 text-sm leading-6 text-content-muted">{children}</p>
      </div>
    </div>
  )
}

function CodeEntry({ initial }: { initial: string }) {
  const { t } = useI18n()
  const router = useRouter()
  const [value, setValue] = useState(initial)
  const [error, setError] = useState(!!initial)

  function submit(event: FormEvent) {
    event.preventDefault()
    const code = normalizeUserCode(value)
    if (!code) {
      setError(true)
      return
    }
    void router.replace({ pathname: '/device', query: { code } })
  }

  return (
    <>
      <p className={metaLabel}>{t('Sign in a device')}</p>
      <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl sm:leading-[1.1]">
        {t('Enter the code from your device')}
      </h1>
      <p className="mt-5 max-w-xl text-base leading-7 text-content-body">
        {t(
          'Run enconvo login on the device you want to sign in, such as a Linux server, and enter the code it shows.'
        )}
      </p>
      <form
        onSubmit={submit}
        className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
        noValidate
      >
        <label htmlFor="device-code" className="sr-only">
          {t('Code')}
        </label>
        <input
          id="device-code"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setError(false)
          }}
          placeholder="BCDF-GHJK"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={error}
          aria-describedby={error ? 'device-code-error' : undefined}
          className="min-h-[48px] flex-1 rounded-lg border border-hairline bg-surface-card px-4 font-mono text-base uppercase tracking-[0.12em] text-content placeholder:text-content-ash focus:border-hairline-strong focus:outline-none"
        />
        <button type="submit" className={primaryButton}>
          {t('Continue')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
      {error && (
        <p
          id="device-code-error"
          role="alert"
          className="mt-3 text-sm text-signal-yellow"
        >
          {t(CODE_HINT)}
        </p>
      )}
    </>
  )
}

function Outcome({
  tone,
  label,
  title,
  body,
}: {
  tone: 'done' | 'stopped'
  label: string
  title: React.ReactNode
  body: string
}) {
  const { t } = useI18n()
  return (
    <>
      <div className="flex items-center gap-3">
        {tone === 'done' ? (
          <BadgeCheck className="h-5 w-5 text-signal-green" aria-hidden="true" />
        ) : (
          <AlertCircle className="h-5 w-5 text-content-muted" aria-hidden="true" />
        )}
        <span className={metaLabel}>{label}</span>
      </div>
      <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl sm:leading-[1.1]">
        {title}
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-8 text-content-body">
        {body}
      </p>
      {tone === 'stopped' && (
        <div className="mt-8">
          <Link href="/device" className={secondaryButton}>
            {t('Enter another code')}
          </Link>
        </div>
      )}
    </>
  )
}

export default function DevicePage() {
  const { t, locale } = useI18n()
  const router = useRouter()
  const typed = typeof router.query.code === 'string' ? router.query.code : ''
  const code = normalizeUserCode(typed)

  const [email, setEmail] = useState<string | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [request, setRequest] = useState<DeviceRequest | null>(null)
  const [unusable, setUnusable] = useState<string | null>(null)
  const [answer, setAnswer] = useState<'approved' | 'denied' | null>(null)
  const [busy, setBusy] = useState<'load' | 'approve' | 'deny' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const returnUrl = encodeURIComponent(`/device?code=${code ?? ''}`)

  useEffect(() => {
    let cancelled = false
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setEmail(data.session?.user.email ?? null)
      setSessionChecked(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setEmail(session?.user.email ?? null)
      }
    )
    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  // A new code or account starts over.
  useEffect(() => {
    setRequest(null)
    setUnusable(null)
    setAnswer(null)
    setError(null)
    if (!code || !email) return
    let cancelled = false
    setBusy('load')
    void (async () => {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      if (!data.session) {
        setEmail(null)
        setBusy(null)
        return
      }
      const result = await inspectDeviceRequest(data.session.access_token, code)
      if (cancelled) return
      setBusy(null)
      if (result.ok) {
        if (result.data.status === 'pending') setRequest(result.data)
        else setUnusable(UNUSABLE.already_decided)
        return
      }
      refused(result.status, result.reason)
    })()
    return () => {
      cancelled = true
    }
  }, [code, email])

  function refused(status: number, reason: string) {
    if (status === 401) setEmail(null)
    else if (UNUSABLE[reason]) setUnusable(UNUSABLE[reason])
    else
      setError(
        status === 0
          ? 'Could not reach Enconvo. Check your connection and try again.'
          : 'Something went wrong. Please try again.'
      )
  }

  async function decide(approve: boolean) {
    if (!code) return
    setError(null)
    setBusy(approve ? 'approve' : 'deny')
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      setEmail(null)
      setBusy(null)
      return
    }
    const result = await answerDeviceRequest(
      data.session.access_token,
      code,
      approve
    )
    setBusy(null)
    if (result.ok) setAnswer(result.data.status)
    else refused(result.status, result.reason)
  }

  const deviceName = request?.device.name || t('Unknown device')
  const requestedAt = request
    ? new Date(request.created_at).toLocaleTimeString(locale, {
        hour: 'numeric',
        minute: '2-digit',
      })
    : ''

  let content: React.ReactNode
  if (!router.isReady || !sessionChecked) {
    content = (
      <Loader2
        className="h-6 w-6 animate-spin text-content-muted"
        aria-label={t('Loading')}
      />
    )
  } else if (!code) {
    content = <CodeEntry key={typed} initial={typed} />
  } else if (answer === 'approved') {
    content = (
      <Outcome
        tone="done"
        label={t('Device signed in')}
        title={
          <I18nText
            source={'{p0} is signing in'}
            values={{ p0: <span className="break-words">{deviceName}</span> }}
          />
        }
        body={t(
          'Go back to your terminal: Enconvo finishes signing in there within a few seconds. You can close this page.'
        )}
      />
    )
  } else if (answer === 'denied') {
    content = (
      <Outcome
        tone="stopped"
        label={t('Sign-in denied')}
        title={t('The device was not signed in')}
        body={t(
          "If you didn't start this sign-in, nothing else is needed: the code no longer works."
        )}
      />
    )
  } else if (unusable) {
    content = (
      <Outcome
        tone="stopped"
        label={t('Sign in a device')}
        title={t("This code can't be used")}
        body={t(unusable)}
      />
    )
  } else if (!email) {
    content = (
      <>
        <p className={metaLabel}>{t('Sign in a device')}</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl sm:leading-[1.1]">
          {t('Sign in to approve this device')}
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-content-body">
          <I18nText
            source={
              'Your device asked to sign in with the code {p0}. Sign in to the Enconvo account you want it to use.'
            }
            values={{
              p0: <span className="font-mono text-content">{code}</span>,
            }}
          />
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={`/login?returnUrl=${returnUrl}`} className={primaryButton}>
            {t('Sign in')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href={`/register?returnUrl=${returnUrl}`}
            className={secondaryButton}
          >
            {t('Create your account')}
          </Link>
        </div>
      </>
    )
  } else if (!request) {
    content = error ? (
      <Notice tone="error" title={t("Couldn't load the sign-in request")}>
        {t(error)}
      </Notice>
    ) : (
      <Loader2
        className="h-6 w-6 animate-spin text-content-muted"
        aria-label={t('Loading')}
      />
    )
  } else {
    content = (
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-start lg:gap-16">
        <div>
          <p className={metaLabel}>{t('Sign in a device')}</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl sm:leading-[1.1]">
            {t('Approve this sign-in?')}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-content-body">
            {t('Check that your device shows this same code:')}
          </p>
          <p className="mt-3 inline-block rounded-md border border-hairline-strong bg-surface-card px-4 py-2 font-mono text-2xl tracking-[0.16em] text-content">
            {code}
          </p>

          <Notice tone="warning" title={t('Only approve a sign-in you started')}>
            {t(
              'Approving lets this device use your Enconvo account and its Cloud points. If someone sent you this link or code, deny it.'
            )}
          </Notice>
          {error && (
            <Notice tone="error" title={t("Couldn't answer the request")}>
              {t(error)}
            </Notice>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void decide(true)}
              disabled={!!busy}
              className={primaryButton}
            >
              {busy === 'approve' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {t('Approve')}
            </button>
            <button
              type="button"
              onClick={() => void decide(false)}
              disabled={!!busy}
              className={secondaryButton}
            >
              {busy === 'deny' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {t('Deny')}
            </button>
          </div>
          <p className="mt-4 text-sm text-content-muted">
            <I18nText
              source={'Approving as {p0}.'}
              values={{ p0: <span className="text-content">{email}</span> }}
            />{' '}
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
          <h2 className={metaLabel}>{t('The device')}</h2>
          <dl className="mt-5 divide-y divide-hairline text-sm">
            <div className="flex items-baseline justify-between gap-4 pb-4">
              <dt className="text-content-muted">{t('Name')}</dt>
              <dd className="min-w-0 break-words text-right font-semibold text-content">
                {deviceName}
              </dd>
            </div>
            {request.device.platform && (
              <div className="flex items-baseline justify-between gap-4 py-4">
                <dt className="text-content-muted">{t('Platform')}</dt>
                <dd className="min-w-0 break-words text-right font-mono text-content">
                  {request.device.platform}
                </dd>
              </div>
            )}
            {request.device.version && (
              <div className="flex items-baseline justify-between gap-4 py-4">
                <dt className="text-content-muted">{t('Enconvo version')}</dt>
                <dd className="min-w-0 break-words text-right font-mono text-content">
                  {request.device.version}
                </dd>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-4 py-4">
              <dt className="text-content-muted">{t('Location')}</dt>
              <dd className="min-w-0 break-words text-right text-content">
                {request.location || t('Unknown')}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 pt-4">
              <dt className="text-content-muted">{t('Requested')}</dt>
              <dd className="text-content">{requestedAt}</dd>
            </div>
          </dl>
          <p className="mt-5 text-xs leading-5 text-content-ash">
            {t(
              'The device reports its own name, platform and version. The location is approximate, from the network it used.'
            )}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{t('Sign in a device - Enconvo')}</title>
        <meta
          name="description"
          content={t(
            'Approve an Enconvo sign-in that started on another device, such as a Linux server.'
          )}
        />
      </Head>
      <div className="min-h-screen bg-canvas text-content">
        <SiteNav />
        <main className="mx-auto max-w-[1240px] px-6 pb-24 pt-36 lg:px-12">
          {content}
        </main>
        <Footer />
      </div>
    </>
  )
}

export const getStaticProps = i18nStaticProps('/device')
