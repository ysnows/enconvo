import { withI18nProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { FormEvent, useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import { ArrowRight, Lock } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import { WORKER_API_ORIGIN } from '@/lib/worker-api'

// A chat someone shared from the Enconvo app. The Worker stores a static HTML
// snapshot of the Chat View; this page frames it. The snapshot is user content,
// so it only ever renders inside a sandboxed iframe with scripts off.

interface ShareMeta {
  id: string
  title: string
  visibility: 'public' | 'password'
  locked: boolean
  messageCount: number
  createdAt: number
  updatedAt: number
}

interface SharePageProps {
  // null = the Worker could not be reached while rendering.
  share: ShareMeta | null
  id: string
}

type Theme = 'light' | 'dark'

const SHARE_ID = /^[A-Za-z0-9]{16}$/
const LOOKUP_TIMEOUT_MS = 3500
const IFRAME_SANDBOX = 'allow-popups allow-popups-to-escape-sandbox'

const shareApi = (id: string, path = '') =>
  `${WORKER_API_ORIGIN}/share/v1/chats/${encodeURIComponent(id)}${path}`

export const getServerSideProps: GetServerSideProps<SharePageProps> =
  withI18nProps(async ({ params, res }) => {
    const id = typeof params?.id === 'string' ? params.id : ''
    if (!SHARE_ID.test(id)) return { notFound: true }

    let share: ShareMeta | null = null
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS)
    try {
      const response = await fetch(shareApi(id), { signal: controller.signal })
      if (response.status === 404) return { notFound: true }
      if (response.ok) share = (await response.json()) as ShareMeta
    } catch {
      share = null
    } finally {
      clearTimeout(timer)
    }

    res.setHeader('Cache-Control', 'private, no-store')
    return { props: { share, id } }
  }, '/share/[id]')

// The site itself is dark only; a shared chat follows the reader's system theme.
const shellStyles = `
.share-shell {
  --share-bg: #f7f7f8;
  --share-bar: rgba(255, 255, 255, 0.82);
  --share-line: rgba(0, 0, 0, 0.08);
  --share-text: #0b0b0c;
  --share-muted: #6b6b70;
  --share-card: #ffffff;
  --share-input: rgba(0, 0, 0, 0.03);
  --share-primary: #0b0b0c;
  --share-primary-text: #ffffff;
  --share-error: #d93636;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  .share-shell {
    --share-bg: #07080a;
    --share-bar: rgba(13, 13, 13, 0.82);
    --share-line: rgba(255, 255, 255, 0.09);
    --share-text: #f4f4f6;
    --share-muted: #9c9c9d;
    --share-card: #121212;
    --share-input: rgba(255, 255, 255, 0.04);
    --share-primary: #ffffff;
    --share-primary-text: #000000;
    --share-error: #ff6161;
    color-scheme: dark;
  }
}
`

function useSystemTheme(): Theme | null {
  const [theme, setTheme] = useState<Theme | null>(null)
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setTheme(query.matches ? 'dark' : 'light')
    update()
    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [])
  return theme
}

function ShareTopBar({ share }: { share: ShareMeta | null }) {
  const { t, locale } = useI18n()
  const [date, setDate] = useState('')

  // Formatted after mount: the server's time zone is not the reader's.
  useEffect(() => {
    if (!share?.updatedAt) return
    setDate(
      new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
        new Date(share.updatedAt)
      )
    )
  }, [share?.updatedAt, locale])

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[color:var(--share-line)] bg-[color:var(--share-bar)] px-4 backdrop-blur-xl">
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 text-sm font-semibold text-[color:var(--share-text)]"
      >
        <img src="/logo.webp" alt="" width={22} height={22} className="h-[22px] w-[22px] rounded-[6px]" />
        <span className="hidden sm:inline">Enconvo</span>
      </Link>
      <span className="hidden h-4 w-px shrink-0 bg-[color:var(--share-line)] sm:block" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <h1 className="min-w-0 truncate text-sm font-medium text-[color:var(--share-text)]">
          {share?.title || t('Shared chat')}
        </h1>
        {date && (
          <span className="hidden shrink-0 text-xs text-[color:var(--share-muted)] md:inline">
            {t('Shared from Enconvo')} · {date}
          </span>
        )}
      </div>
      <Link
        href="/"
        onClick={() =>
          trackEvent('shared_chat_cta_click', {}, { includePagePath: false })
        }
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[color:var(--share-primary)] px-3 text-xs font-semibold text-[color:var(--share-primary-text)] transition-opacity hover:opacity-85"
      >
        {t('Try Enconvo')}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </header>
  )
}

function CenteredMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <h2 className="text-base font-semibold text-[color:var(--share-text)]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[color:var(--share-muted)]">{body}</p>
      </div>
    </div>
  )
}

function PasswordGate({
  id,
  theme,
  onUnlock,
}: {
  id: string
  theme: Theme
  onUnlock: (html: string) => void
}) {
  const { t } = useI18n()
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!password || pending) return
    setPending(true)
    setError('')
    try {
      const response = await fetch(shareApi(id, '/unlock'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, theme }),
      })
      const body = await response.json().catch(() => null)
      if (response.ok && typeof body?.html === 'string') {
        trackEvent('shared_chat_unlock', {}, { includePagePath: false })
        onUnlock(body.html)
        return
      }
      if (body?.error === 'wrong_password') setError(t('That password is not right.'))
      else if (body?.error === 'too_many_attempts')
        setError(t('Too many tries. Wait a few minutes and try again.'))
      else setError(t('Something went wrong. Please try again.'))
    } catch {
      setError(t('Could not reach Enconvo. Check your connection and try again.'))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-[color:var(--share-line)] bg-[color:var(--share-card)] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--share-line)] bg-[color:var(--share-input)] text-[color:var(--share-text)]">
          <Lock className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-base font-semibold text-[color:var(--share-text)]">
          {t('This chat is password protected')}
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-[color:var(--share-muted)]">
          {t('Enter the password the sender shared with you.')}
        </p>
        <label htmlFor="share-password" className="sr-only">
          {t('Password')}
        </label>
        <input
          id="share-password"
          type="password"
          autoFocus
          autoComplete="off"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            if (error) setError('')
          }}
          placeholder={t('Password')}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'share-password-error' : undefined}
          className="mt-5 h-10 w-full rounded-lg border border-[color:var(--share-line)] bg-[color:var(--share-input)] px-3 text-sm text-[color:var(--share-text)] outline-none placeholder:text-[color:var(--share-muted)] focus:border-[#57C1FF] focus:ring-2 focus:ring-[#57C1FF]/25"
        />
        {error && (
          <p id="share-password-error" role="alert" className="mt-2 text-xs text-[color:var(--share-error)]">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={!password || pending}
          className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[color:var(--share-primary)] text-sm font-semibold text-[color:var(--share-primary-text)] transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {pending ? t('Checking…') : t('View chat')}
        </button>
      </form>
    </div>
  )
}

export default function SharedChatPage({ share, id }: SharePageProps) {
  const { t } = useI18n()
  const theme = useSystemTheme()
  const [unlockedHtml, setUnlockedHtml] = useState<string | null>(null)
  const [frameLoaded, setFrameLoaded] = useState(false)

  useEffect(() => {
    if (share)
      trackEvent(
        'shared_chat_view',
        { visibility: share.visibility },
        { includePagePath: false }
      )
  }, [share])

  const title = share?.title ? `${share.title} - Enconvo` : t('Shared chat - Enconvo')
  const description = t('A chat shared from Enconvo, the AI assistant for your Mac.')

  let body: JSX.Element | null = null
  if (!share) {
    body = (
      <CenteredMessage
        title={t('This chat could not be loaded')}
        body={t('Could not reach Enconvo. Check your connection and reload the page.')}
      />
    )
  } else if (!theme) {
    // Waits one frame for the reader's theme so the chat loads once, in the right colors.
    body = null
  } else if (share.locked && unlockedHtml === null) {
    body = <PasswordGate id={id} theme={theme} onUnlock={setUnlockedHtml} />
  } else {
    body = (
      <div className="relative flex flex-1 flex-col">
        {!frameLoaded && (
          <div
            className="pointer-events-none absolute inset-0 flex items-start justify-center pt-24"
            aria-hidden="true"
          >
            <div className="flex w-full max-w-[720px] flex-col gap-4 px-6">
              <div className="ml-auto h-10 w-2/5 animate-pulse rounded-2xl bg-[color:var(--share-line)]" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-[color:var(--share-line)]" />
              <div className="h-4 w-3/5 animate-pulse rounded bg-[color:var(--share-line)]" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-[color:var(--share-line)]" />
            </div>
          </div>
        )}
      <iframe
        key={unlockedHtml === null ? theme : 'unlocked'}
        onLoad={() => setFrameLoaded(true)}
        title={share.title || t('Shared chat')}
        sandbox={IFRAME_SANDBOX}
        referrerPolicy="no-referrer"
        {...(unlockedHtml === null
          ? { src: shareApi(id, `/content?theme=${theme}`) }
          : { srcDoc: unlockedHtml })}
        className={`block w-full flex-1 border-0 bg-transparent transition-opacity duration-300 ${frameLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="referrer" content="no-referrer" />
        <meta property="og:type" content="website" key="og:type" />
        <meta property="og:site_name" content="Enconvo" key="og:site_name" />
        <meta property="og:title" content={share?.title || t('Shared chat')} key="og:title" />
        <meta property="og:description" content={t('Shared from Enconvo')} key="og:description" />
        <meta name="twitter:card" content="summary" key="twitter:card" />
        <meta name="twitter:title" content={share?.title || t('Shared chat')} key="twitter:title" />
        <meta name="twitter:description" content={t('Shared from Enconvo')} key="twitter:description" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: shellStyles }} />
      <div className="share-shell flex h-screen flex-col bg-[color:var(--share-bg)] text-[color:var(--share-text)] [height:100dvh]">
        <ShareTopBar share={share} />
        {body}
      </div>
    </>
  )
}
