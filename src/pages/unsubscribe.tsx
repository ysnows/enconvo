import { useCallback, useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { trackEvent } from '@/lib/analytics'
import {
  MAX_NOTE_CHARACTERS,
  UNSUBSCRIBE_REASONS,
  callUnsubscribeLink,
  feedbackReady,
  noteLength,
  readLinkAddress,
  unsubscribedDate,
  type LinkState,
  type UnsubscribeReason,
} from '@/lib/unsubscribe'
import styles from '@/styles/Unsubscribe.module.css'

// Where a product email's Unsubscribe link lands. Nobody signs in: the link's token names the
// address. Opening the page changes nothing, one press unsubscribes, and the optional question
// comes only after that. English only, like the emails it belongs to.

/** The link's token, kept for a reload of this tab once it has left the address bar. */
const TOKEN_STORE = 'enconvo_unsubscribe_link'

type View =
  | 'loading'
  /** The address is subscribed: one button. */
  | 'confirm'
  /** Just unsubscribed here. */
  | 'done'
  /** Just subscribed again here. */
  | 'resubscribed'
  /** A valid link whose address was already off the list. */
  | 'already'
  /** No personal link in the address. */
  | 'no_link'
  /** A link the Worker can't read: cut off, changed or too old. */
  | 'broken'
  /** The link couldn't be checked. */
  | 'unreachable'

type Feedback = 'form' | 'sending' | 'sent' | 'hidden'

const ACCOUNT_LINE =
  'Sign-in codes, receipts and other account emails still arrive.'

function Check({ size = 18 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

function Problem({ children }: { children: React.ReactNode }) {
  return (
    <p className={styles.err} role="alert">
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5.5" />
        <path d="M12 16.5v.2" />
      </svg>
      <span>{children}</span>
    </p>
  )
}

function track(name: string, params: Record<string, string> = {}) {
  // Never the address, the token or the note: the page's public name stands in for its location.
  trackEvent(name, params, { includePagePath: false })
}

export default function UnsubscribePage() {
  const router = useRouter()
  const [view, setView] = useState<View>('loading')
  const [state, setState] = useState<LinkState | null>(null)
  const [busy, setBusy] = useState(false)
  /** The last press that failed, so the page can say what is still true. */
  const [failed, setFailed] = useState<'unsubscribe' | 'resubscribe' | null>(null)
  const [feedback, setFeedback] = useState<Feedback>('form')
  const [feedbackProblem, setFeedbackProblem] = useState<
    'failed' | 'limit' | null
  >(null)
  const [reason, setReason] = useState<UnsubscribeReason | null>(null)
  const [note, setNote] = useState('')
  const token = useRef<string | null>(null)
  const started = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)

  const show = useCallback((next: View, focus = true) => {
    setView(next)
    // A changed card is announced from its heading.
    if (focus) window.setTimeout(() => heading.current?.focus(), 0)
  }, [])

  const load = useCallback(async () => {
    if (!token.current) return
    setView('loading')
    const result = await callUnsubscribeLink('status', { token: token.current })
    if (result.ok) {
      setState(result.data)
      const next = result.data.subscribed ? 'confirm' : 'already'
      setView(next)
      track('unsubscribe_page_viewed', { state: next })
      return
    }
    if (result.error === 'invalid_link') {
      try {
        window.sessionStorage.removeItem(TOKEN_STORE)
      } catch {}
      token.current = null
      setView('broken')
      track('unsubscribe_page_viewed', { state: 'broken' })
      return
    }
    setView('unreachable')
  }, [])

  useEffect(() => {
    if (!router.isReady || started.current) return
    started.current = true
    const address = readLinkAddress(window.location)
    let stored: string | null = null
    try {
      if (address.token) window.sessionStorage.setItem(TOKEN_STORE, address.token)
      else if (address.invalid) window.sessionStorage.removeItem(TOKEN_STORE)
      else stored = window.sessionStorage.getItem(TOKEN_STORE)
    } catch {
      // Private browsing without storage: the page works until it is reloaded.
    }
    if (address.token) {
      // The token leaves the address bar, the history entry and anything that reports the
      // page's location, before analytics may load (_app).
      window.history.replaceState(window.history.state, '', window.location.pathname)
      void router.replace(router.pathname, undefined, { shallow: true })
    }
    token.current = address.token || stored
    if (token.current) void load()
    else {
      const next = address.invalid ? 'broken' : 'no_link'
      setView(next)
      track('unsubscribe_page_viewed', { state: next })
    }
  }, [router.isReady, router, load])

  // The page is light whatever the site around it, the overscroll area included.
  useEffect(() => {
    const root = document.documentElement
    const background = root.style.backgroundColor
    root.style.backgroundColor = '#f4f3ef'
    return () => {
      root.style.backgroundColor = background
    }
  }, [])

  async function unsubscribe(again: boolean) {
    if (busy || !token.current) return
    setBusy(true)
    setFailed(null)
    const result = await callUnsubscribeLink('unsubscribe', { token: token.current })
    setBusy(false)
    if (!result.ok) {
      setFailed('unsubscribe')
      return
    }
    setState(result.data)
    // Leaving a second time doesn't ask why a second time.
    if (again) setFeedback((current) => (current === 'sent' ? 'sent' : 'hidden'))
    show('done')
    track('email_unsubscribed')
  }

  async function resubscribe() {
    if (busy || !token.current) return
    setBusy(true)
    setFailed(null)
    const result = await callUnsubscribeLink('resubscribe', { token: token.current })
    setBusy(false)
    if (!result.ok) {
      setFailed('resubscribe')
      return
    }
    setState(result.data)
    show('resubscribed')
    track('email_resubscribed')
  }

  async function sendFeedback() {
    if (feedback !== 'form' || !token.current || !feedbackReady(reason, note)) return
    setFeedback('sending')
    setFeedbackProblem(null)
    const result = await callUnsubscribeLink<{ saved: boolean }>('feedback', {
      token: token.current,
      reason,
      note: note.trim(),
    })
    if (!result.ok) {
      setFeedback('form')
      setFeedbackProblem(result.status === 429 ? 'limit' : 'failed')
      return
    }
    setFeedback('sent')
    track('unsubscribe_feedback_sent', { reason: reason ?? 'none' })
  }

  const address = <span className={styles.addr}>{state?.email}</span>
  const kicker = <p className={styles.kicker}>Email preferences</p>
  const title = (text: string) => (
    <h1 className={styles.h1} ref={heading} tabIndex={-1}>
      {text}
    </h1>
  )
  const mark = (
    <div className={styles.mark}>
      <Check />
    </div>
  )
  const length = noteLength(note)
  const ready = feedback === 'form' && feedbackReady(reason, note)
  const accountLink = (
    <Link className={styles.a} href="/account">
      your account
    </Link>
  )

  let card: React.ReactNode
  if (view === 'loading') {
    card = (
      <>
        {kicker}
        <p className={styles.p} role="status" style={{ marginTop: 0 }}>
          Checking your link…
        </p>
      </>
    )
  } else if (view === 'confirm') {
    card = (
      <>
        {kicker}
        {title('Unsubscribe from product updates?')}
        <p className={styles.p}>
          {address} will stop getting Enconvo’s product update emails. {ACCOUNT_LINE}
        </p>
        {failed === 'unsubscribe' && (
          <Problem>
            That didn’t go through, so you’re still subscribed. Try again in a moment.
          </Problem>
        )}
        <div
          className={`${styles.actions} ${failed === 'unsubscribe' ? styles.actionsTight : ''}`}
        >
          <button
            type="button"
            className={`${styles.btn} ${busy ? styles.busy : ''}`}
            aria-disabled={busy}
            onClick={() => void unsubscribe(false)}
          >
            {busy ? (
              <>
                <span className={styles.spin} aria-hidden="true" />
                Unsubscribing…
              </>
            ) : failed === 'unsubscribe' ? (
              'Try again'
            ) : (
              'Unsubscribe'
            )}
          </button>
          {failed !== 'unsubscribe' && (
            <p className={styles.aside}>Changed your mind? Just close this page.</p>
          )}
        </div>
      </>
    )
  } else if (view === 'done') {
    card = (
      <>
        {mark}
        {kicker}
        {title('You’re unsubscribed')}
        <p className={styles.p}>
          {address} won’t get product updates from Enconvo anymore. Account emails aren’t
          affected.
        </p>
        {state?.can_resubscribe && (
          <p className={styles.small}>
            Unsubscribed by mistake?{' '}
            <button
              type="button"
              className={styles.a}
              disabled={busy}
              onClick={() => void resubscribe()}
            >
              {busy ? 'Subscribing…' : 'Subscribe again'}
            </button>
          </p>
        )}
        {failed === 'resubscribe' && (
          <Problem>
            That didn’t go through, so you’re still unsubscribed. Try again in a moment.
          </Problem>
        )}
        {(feedback === 'form' || feedback === 'sending') && (
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              void sendFeedback()
            }}
          >
            <div className={styles.rule} />
            <h2 className={styles.ft} id="unsubscribe-why">
              Mind telling us why? <span className={styles.tag}>Optional</span>
            </h2>
            <p className={styles.fs}>You’re unsubscribed either way.</p>
            <div
              className={styles.reasons}
              role="radiogroup"
              aria-label="Why are you leaving?"
            >
              {UNSUBSCRIBE_REASONS.map(([key, label]) => (
                <label
                  key={key}
                  className={`${styles.reason} ${reason === key ? styles.on : ''}`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={key}
                    checked={reason === key}
                    disabled={feedback === 'sending'}
                    onChange={() => setReason(key)}
                  />
                  <span className={styles.radio} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <label className={styles.lab} htmlFor="unsubscribe-note">
              Anything else we should know?
            </label>
            <textarea
              id="unsubscribe-note"
              className={styles.ta}
              placeholder="Optional"
              value={note}
              readOnly={feedback === 'sending'}
              aria-describedby={length > MAX_NOTE_CHARACTERS ? 'unsubscribe-note-limit' : undefined}
              aria-invalid={length > MAX_NOTE_CHARACTERS}
              onChange={(event) => setNote(event.target.value)}
            />
            {length > MAX_NOTE_CHARACTERS && (
              <p className={styles.limit} id="unsubscribe-note-limit" role="status">
                <span>That’s the limit. Trim it a little to send.</span>
                <span>
                  {length} / {MAX_NOTE_CHARACTERS}
                </span>
              </p>
            )}
            {feedbackProblem && (
              <Problem>
                {feedbackProblem === 'limit'
                  ? 'We already have feedback from this address today, so this one wasn’t added.'
                  : 'That didn’t send. Try again in a moment.'}
              </Problem>
            )}
            <div className={`${styles.actions} ${styles.actionsTight}`}>
              <button
                type="submit"
                className={`${styles.btn} ${ready ? styles.quiet : styles.off}`}
                aria-disabled={!ready}
              >
                {feedback === 'sending' ? (
                  <>
                    <span className={styles.spin} aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  'Send feedback'
                )}
              </button>
            </div>
            <p className={styles.fine}>
              We keep your answer with this email address, and nothing else.
            </p>
          </form>
        )}
        {feedback === 'sent' && (
          <>
            <div className={styles.rule} />
            <p className={styles.thanks} role="status">
              <Check size={16} />
              <span>
                <strong>Thanks for telling us.</strong> It goes straight to the people who
                write these emails.
              </span>
            </p>
          </>
        )}
      </>
    )
  } else if (view === 'resubscribed') {
    card = (
      <>
        {mark}
        {kicker}
        {title('You’re subscribed again')}
        <p className={styles.p}>
          {address} will keep getting Enconvo’s product updates. Nothing else changed.
        </p>
        <p className={styles.small}>
          Didn’t mean to?{' '}
          <button
            type="button"
            className={styles.a}
            disabled={busy}
            onClick={() => void unsubscribe(true)}
          >
            {busy ? 'Unsubscribing…' : 'Unsubscribe'}
          </button>
        </p>
        {failed === 'unsubscribe' && (
          <Problem>
            That didn’t go through, so you’re still subscribed. Try again in a moment.
          </Problem>
        )}
      </>
    )
  } else if (view === 'already') {
    const date = unsubscribedDate(state?.unsubscribed_at ?? null)
    card = (
      <>
        {mark}
        {kicker}
        {title('You’re already unsubscribed')}
        <p className={styles.p}>
          {address}{' '}
          {date
            ? `stopped getting product updates on ${date}.`
            : 'isn’t getting product updates from Enconvo.'}{' '}
          There’s nothing more to do.
        </p>
        {state?.can_resubscribe && (
          <p className={styles.small}>
            Want them back?{' '}
            <button
              type="button"
              className={styles.a}
              disabled={busy}
              onClick={() => void resubscribe()}
            >
              {busy ? 'Subscribing…' : 'Subscribe again'}
            </button>
          </p>
        )}
        {failed === 'resubscribe' && (
          <Problem>
            That didn’t go through, so you’re still unsubscribed. Try again in a moment.
          </Problem>
        )}
      </>
    )
  } else if (view === 'unreachable') {
    card = (
      <>
        {kicker}
        {title('We couldn’t check this link')}
        <p className={styles.p}>
          Nothing has changed. Try again in a moment.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.btn} onClick={() => void load()}>
            Try again
          </button>
        </div>
      </>
    )
  } else {
    // No link of one's own, or one that no longer works. Asking for a fresh link by email comes
    // later; until then the email's own link and the Account page are the two ways.
    card = (
      <>
        {kicker}
        {title(
          view === 'broken'
            ? 'This link doesn’t work anymore'
            : 'Unsubscribe from product updates'
        )}
        <p className={styles.p}>
          {view === 'broken'
            ? 'It may be incomplete or too old. Open the Unsubscribe link in a newer Enconvo email, or turn product updates off in '
            : 'Open the Unsubscribe link at the bottom of an Enconvo product email and it brings you here for your address, with no sign-in. Or turn product updates off in '}
          {accountLink}.
        </p>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Email preferences - Enconvo</title>
        <meta name="referrer" content="no-referrer" />
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#f4f3ef" />
      </Head>
      <div className={styles.page}>
        <Link className={styles.brand} href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/enconvo-mark-64.png" alt="" width={32} height={32} />
          <span>Enconvo</span>
        </Link>
        <main className={styles.card} aria-busy={view === 'loading' || busy}>
          {card}
        </main>
        <p className={styles.foot}>
          Enconvo · THE GREAT LIONHEART PTE. LTD. ·{' '}
          <Link href="/privacy">Privacy</Link>
        </p>
        <noscript>
          <p className={styles.foot}>
            This page needs JavaScript to read your link. You can also turn product updates
            off in your account at enconvo.com/account.
          </p>
        </noscript>
      </div>
    </>
  )
}
