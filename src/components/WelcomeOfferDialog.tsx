import { Dialog } from '@headlessui/react'
import Link from 'next/link'
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from 'react'
import { AlertCircle, Loader2, Sparkles, X } from 'lucide-react'
import { useI18n } from '@/i18n/I18nProvider'
import { I18nText } from '@/i18n/I18nText'
import { metaLabel, primaryButton, secondaryButton } from '@/components/landing-styles'
import { trackEvent } from '@/lib/analytics'
import { formatRewardUsd } from '@/lib/invite'
import { burstConfetti } from '@/lib/ltd-confetti'
import {
  claimEnded,
  formatOfferDate,
  offerHomePath,
  refusalCopy,
  type RefusalReason,
  type WelcomeOfferClaim,
  type WelcomeOfferInfo,
  type WelcomeOfferState,
} from '@/lib/welcome-offer'
import {
  claimFromPopup,
  closeWelcomeOffer,
  leaveWelcomeOffer,
} from '@/lib/welcome-offer-auto-claim'
import styles from '@/styles/WelcomeOffer.module.css'

const DOWNLOAD_ARM64 =
  'https://api.enconvo.com/app/download?arch=arm64&platform=darwin'
const DOWNLOAD_X64 =
  'https://api.enconvo.com/app/download?arch=x64&platform=darwin'

/** The gift opens once the card has risen, or right away after a Claim click. */
const OPEN_AFTER_ARRIVAL_MS = 380
const OPEN_AFTER_CLICK_MS = 40

/** The step's main action, which the popup focuses first. */
type FocusRef = MutableRefObject<(HTMLAnchorElement & HTMLButtonElement) | null>

const textLink =
  'font-medium text-content underline decoration-hairline-strong underline-offset-4 hover:decoration-content'
const eyebrow = 'text-[11px] font-medium uppercase tracking-[0.16em]'
/** A busy Claim or Try again button keeps focus (aria-disabled, not disabled) and ignores clicks. */
const busyButton = 'aria-disabled:cursor-wait aria-disabled:opacity-60'

/**
 * Each step's title takes focus when a click moves the popup to that step, so the answer is read
 * out and keyboard focus stays in the popup.
 */
const stepTitle = { tabIndex: -1, 'data-step-title': true } as const
const titleFocus = 'focus:outline-none'

/** One line of a step; the lines rise in one after another. */
function Rise({
  i,
  className = '',
  children,
}: {
  i: number
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={`${styles.item} ${className}`}
      style={{ '--i': i } as CSSProperties}
    >
      {children}
    </div>
  )
}

/** A four-point sparkle centred on (x, y). */
const sparkle = (x: number, y: number, r: number) =>
  `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`

/** The crystal gift box at the top of the offer; its lid lifts when the offer is claimed. */
function GiftMark({
  opened,
  boxRef,
}: {
  opened: boolean
  boxRef: RefObject<HTMLDivElement>
}) {
  return (
    <div
      ref={boxRef}
      className={`${styles.gift} ${opened ? styles.opened : ''}`}
      style={{ '--gift-delay': '120ms' } as CSSProperties}
      aria-hidden="true"
    >
      <div className={styles.glow} />
      <svg viewBox="0 0 88 88" fill="none" className="relative h-full w-full">
        <defs>
          <linearGradient id="welcome-gift-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#86D3FF" stopOpacity="0.36" />
            <stop offset="1" stopColor="#2563EB" stopOpacity="0.16" />
          </linearGradient>
          <linearGradient id="welcome-gift-lid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D1ECFF" stopOpacity="0.55" />
            <stop offset="1" stopColor="#57C1FF" stopOpacity="0.26" />
          </linearGradient>
          <linearGradient id="welcome-gift-ribbon" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F4F7FB" />
            <stop offset="1" stopColor="#86D3FF" />
          </linearGradient>
          <radialGradient
            id="welcome-gift-ray"
            cx="44"
            cy="44"
            r="36"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="44" cy="79" rx="22" ry="2.5" fill="#57C1FF" opacity="0.16" />
        <g className={styles.rays} fill="url(#welcome-gift-ray)">
          <path d="M44 44L41 10H47Z" />
          <path d="M44 44L55.6 11.9L61.1 14.5Z" />
          <path d="M44 44L26.9 14.5L32.4 11.9Z" />
          <path d="M44 44L68.1 19.8L72 24.4Z" />
          <path d="M44 44L16 24.4L19.9 19.8Z" />
          <ellipse cx="44" cy="45" rx="18" ry="4" fill="#FFFFFF" opacity="0.45" />
        </g>
        <rect
          x="20"
          y="44"
          width="48"
          height="32"
          rx="6"
          fill="url(#welcome-gift-body)"
          stroke="#FFFFFF"
          strokeOpacity="0.26"
        />
        <path d="M24 47H64" stroke="#FFFFFF" strokeOpacity="0.16" />
        <path d="M20 64L36 44" stroke="#FFFFFF" strokeOpacity="0.08" />
        <rect
          x="40"
          y="44"
          width="8"
          height="32"
          fill="url(#welcome-gift-ribbon)"
          opacity="0.9"
        />
        <g className={styles.lid}>
          <rect
            x="16"
            y="34"
            width="56"
            height="11"
            rx="4.5"
            fill="url(#welcome-gift-lid)"
            stroke="#FFFFFF"
            strokeOpacity="0.32"
          />
          <rect
            x="40"
            y="34"
            width="8"
            height="11"
            fill="url(#welcome-gift-ribbon)"
          />
          <path
            d="M44 34C40 25 30 22 30.5 29C31 33.5 38 34 44 34Z"
            fill="url(#welcome-gift-ribbon)"
            fillOpacity="0.85"
            stroke="#FFFFFF"
            strokeOpacity="0.5"
            strokeWidth="0.8"
          />
          <path
            d="M44 34C48 25 58 22 57.5 29C57 33.5 50 34 44 34Z"
            fill="url(#welcome-gift-ribbon)"
            fillOpacity="0.85"
            stroke="#FFFFFF"
            strokeOpacity="0.5"
            strokeWidth="0.8"
          />
          <rect x="41" y="30.5" width="6" height="4.5" rx="2" fill="#F4F7FB" />
        </g>
        {[
          [13, 24, 4.5],
          [75, 20, 3.5],
          [79, 52, 2.5],
          [9, 56, 2.5],
        ].map(([x, y, r], index) => (
          <path
            key={index}
            d={sparkle(x, y, r)}
            fill="#EAF6FF"
            className={styles.spark}
            style={{ '--i': index } as CSSProperties}
          />
        ))}
      </svg>
    </div>
  )
}

function Title({ children }: { children: ReactNode }) {
  return (
    <Dialog.Title
      {...stepTitle}
      className={`mt-4 pr-10 text-2xl font-semibold leading-tight text-content [text-wrap:balance] [word-break:auto-phrase] ${titleFocus}`}
    >
      {children}
    </Dialog.Title>
  )
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex flex-col gap-3">{children}</div>
}

/** The offer itself: sign up to claim, or one Claim click for a signed-in visitor. */
function OfferStep({
  state,
  info,
  claiming,
  returnPath,
  focusRef,
}: {
  state: WelcomeOfferState
  info: WelcomeOfferInfo
  claiming: boolean
  returnPath: string
  focusRef: FocusRef
}) {
  const { t, locale } = useI18n()
  const returnUrl = encodeURIComponent(returnPath)
  const claimBy = formatOfferDate(info.ends_at, locale)
  const leave = (via: 'sign_up' | 'sign_in') => {
    trackEvent(
      'welcome_offer_signup_clicked',
      { offer: state.slug, via },
      { includePagePath: false }
    )
    leaveWelcomeOffer()
  }
  return (
    <div className="text-center">
      <Rise i={0} className="mt-5">
        <p className={`${eyebrow} text-signal-blue`}>{t('A gift for you')}</p>
      </Rise>
      <Rise i={1}>
        <Dialog.Title
          {...stepTitle}
          className={`mt-2 text-[28px] font-semibold leading-[34px] text-content [text-wrap:balance] [word-break:auto-phrase] ${titleFocus}`}
        >
          <I18nText
            source={'{days} days of Plus Cloud'}
            values={{
              days: (
                <span className="bg-gradient-to-b from-white to-signal-blue bg-clip-text text-transparent">
                  {info.days}
                </span>
              ),
            }}
          />
        </Dialog.Title>
      </Rise>
      {info.usd > 0 && (
        <Rise i={2} className="mt-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-signal-blue/25 bg-signal-blue/10 px-3 py-1.5 text-[13px] font-medium leading-[18px] text-content">
            <Sparkles className="h-3.5 w-3.5 text-signal-blue" aria-hidden="true" />
            {t('{usd} of AI points included', { usd: formatRewardUsd(info.usd) })}
          </span>
        </Rise>
      )}
      <Rise i={3}>
        <p className="mx-auto mt-3 max-w-[320px] text-sm leading-5 text-content-muted [text-wrap:balance] [word-break:auto-phrase]">
          {t('Free, no card needed. It ends on its own.')}
        </p>
      </Rise>
      <Rise i={4}>
        <Actions>
          {state.signedIn ? (
            <>
              <button
                ref={focusRef}
                type="button"
                onClick={() => void claimFromPopup()}
                aria-disabled={claiming || undefined}
                className={`${primaryButton} ${busyButton} w-full`}
              >
                {claiming && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                {claiming ? t('Claiming…') : t('Claim')}
              </button>
              <button
                type="button"
                onClick={closeWelcomeOffer}
                className="min-h-[40px] text-[13px] font-medium text-content-muted transition-colors hover:text-content"
              >
                {t('Not now')}
              </button>
            </>
          ) : (
            <>
              <Link
                ref={focusRef}
                href={`/register?returnUrl=${returnUrl}`}
                onClick={() => leave('sign_up')}
                className={`${primaryButton} w-full`}
              >
                {t('Sign up to claim')}
              </Link>
              <p className="text-[13px] leading-[18px] text-content-muted">
                {t('Already have an account?')}{' '}
                <Link
                  href={`/login?returnUrl=${returnUrl}`}
                  onClick={() => leave('sign_in')}
                  className={textLink}
                >
                  {t('Sign in')}
                </Link>
              </p>
            </>
          )}
        </Actions>
      </Rise>
      <Rise i={5}>
        <p className="mt-6 border-t border-hairline pt-4 text-xs leading-5 text-content-ash [text-wrap:balance] [word-break:auto-phrase]">
          {t('One per account. The points end with the plan.')}
          {claimBy && (
            <span className="mt-1 block">
              {t('Claim by {date}.', { date: claimBy })}
            </span>
          )}
        </p>
      </Rise>
    </div>
  )
}

function Stat({
  label,
  value,
  divided,
}: {
  label: string
  value: string
  divided?: boolean
}) {
  return (
    <div className={`px-3 py-3 ${divided ? 'border-l border-hairline' : ''}`}>
      <dt className={`${eyebrow} text-content-muted`}>{label}</dt>
      <dd className="mt-1 text-[15px] font-semibold leading-[22px] text-content">
        {value}
      </dd>
    </div>
  )
}

function ClaimedStep({
  state,
  claim,
  focusRef,
}: {
  state: WelcomeOfferState
  claim: WelcomeOfferClaim
  focusRef: FocusRef
}) {
  const { t, locale } = useI18n()
  // Claimed long enough ago that the plan has ended: nothing is active to show.
  const ended = claim.already_claimed && claimEnded(claim)
  // Short month, so the date fits its half of the card on a phone.
  const endsOn = formatOfferDate(claim.ends_at, locale, 'short')
  const download = (arch: 'arm64' | 'x64') =>
    trackEvent('download_click', { arch, placement: 'welcome_offer' })
  return (
    <>
      <div className="text-center">
        <Rise i={0} className="mt-5">
          <p className={`${eyebrow} text-signal-green`}>
            {ended
              ? t('Welcome offer')
              : claim.already_claimed
                ? t('Already claimed')
                : t('Offer claimed')}
          </p>
        </Rise>
        <Rise i={1}>
          <Dialog.Title
            {...stepTitle}
            className={`mt-2 text-2xl font-semibold leading-[30px] text-content [text-wrap:balance] [word-break:auto-phrase] ${titleFocus}`}
          >
            {ended
              ? t("You've already claimed this offer")
              : t('Your {days}-day Plus Cloud plan is active', {
                  days: claim.days,
                })}
          </Dialog.Title>
        </Rise>
        <Rise i={2}>
          {ended ? (
            <p className="mx-auto mt-3 max-w-[320px] text-[15px] leading-[22px] text-content-body [text-wrap:balance] [word-break:auto-phrase]">
              {t('It was added to your account earlier.')}
            </p>
          ) : (
            <>
              <dl
                className={`mt-5 grid ${endsOn ? 'grid-cols-2' : 'grid-cols-1'} rounded-[18px] border border-hairline bg-white/[0.03]`}
              >
                {endsOn && <Stat label={t('Active until')} value={endsOn} />}
                <Stat
                  label={t('AI points')}
                  value={t('{points} ({usd})', {
                    points: claim.points.toLocaleString(locale),
                    usd: formatRewardUsd(claim.usd),
                  })}
                  divided={!!endsOn}
                />
              </dl>
              <p className="mt-2 text-xs leading-5 text-content-ash">
                {t('The points end with the plan.')}
              </p>
            </>
          )}
        </Rise>
      </div>
      {!ended && (
        <Rise i={3}>
          <p className={`${metaLabel} mt-6`}>{t('Next steps')}</p>
          <ol className="mt-3 space-y-3">
            {[
              t('Download Enconvo for Mac.'),
              state.email ? (
                <I18nText
                  key="sign-in"
                  source={'Open it and sign in as {email}.'}
                  values={{
                    email: (
                      <span className="break-words text-content">
                        {state.email}
                      </span>
                    ),
                  }}
                />
              ) : (
                t('Open it and sign in with this account.')
              ),
            ].map((step, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-[15px] leading-[22px] text-content-body"
              >
                <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full border border-hairline-strong text-xs font-medium text-content">
                  {index + 1}
                </span>
                <span className="min-w-0">{step}</span>
              </li>
            ))}
          </ol>
        </Rise>
      )}
      <Rise i={4}>
        <Actions>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              ref={focusRef}
              href={DOWNLOAD_ARM64}
              onClick={() => download('arm64')}
              className={`${primaryButton} flex-1`}
            >
              {t('Download for Mac')}
            </a>
            <button
              type="button"
              onClick={closeWelcomeOffer}
              className={`${secondaryButton} sm:w-28`}
            >
              {t('Done')}
            </button>
          </div>
          <p className="text-xs leading-5 text-content-ash">
            <a
              href={DOWNLOAD_X64}
              onClick={() => download('x64')}
              className="text-content-muted underline decoration-hairline-strong underline-offset-4 hover:text-content"
            >
              {t('Intel Mac download')}
            </a>
          </p>
        </Actions>
      </Rise>
    </>
  )
}

/** Where a refusal points next, besides closing. */
const REFUSAL_LINKS: Record<
  RefusalReason,
  { href: string; label: string }[]
> = {
  already_subscribed: [
    { href: '/account', label: 'Go to your account' },
    { href: '/cloud-pricing', label: 'See Cloud plans' },
  ],
  offer_ended: [{ href: '/cloud-pricing', label: 'See Cloud plans' }],
  offer_not_found: [{ href: '/cloud-pricing', label: 'See Cloud plans' }],
  offer_not_started: [],
  other_code_open: [],
  unavailable: [{ href: '/cloud-pricing', label: 'See Cloud plans' }],
}

function Notice({
  title,
  body,
  children,
}: {
  title: string
  body: string
  children: ReactNode
}) {
  const { t } = useI18n()
  return (
    <Rise i={0}>
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-signal-yellow" aria-hidden="true" />
        <span className={metaLabel}>{t('Welcome offer')}</span>
      </div>
      <Title>{title}</Title>
      <p className="mt-3 text-[15px] leading-[22px] text-content-body">
        {body}
      </p>
      <Actions>{children}</Actions>
    </Rise>
  )
}

function RefusedStep({
  reason,
  focusRef,
}: {
  reason: RefusalReason
  focusRef: FocusRef
}) {
  const { t } = useI18n()
  const copy = refusalCopy(reason)
  const [primary, secondary] = REFUSAL_LINKS[reason]
  return (
    <Notice title={t(copy.title)} body={t(copy.body)}>
      {primary ? (
        <Link
          ref={focusRef}
          href={primary.href}
          onClick={closeWelcomeOffer}
          className={`${primaryButton} w-full`}
        >
          {t(primary.label)}
        </Link>
      ) : (
        <button
          ref={focusRef}
          type="button"
          onClick={closeWelcomeOffer}
          className={`${primaryButton} w-full`}
        >
          {t('Close')}
        </button>
      )}
      {secondary ? (
        <Link
          href={secondary.href}
          onClick={closeWelcomeOffer}
          className={`${secondaryButton} w-full`}
        >
          {t(secondary.label)}
        </Link>
      ) : (
        primary && (
          <button
            type="button"
            onClick={closeWelcomeOffer}
            className={`${secondaryButton} w-full`}
          >
            {t('Close')}
          </button>
        )
      )}
    </Notice>
  )
}

function FailedStep({
  signIn,
  claiming,
  returnPath,
  focusRef,
}: {
  signIn: boolean
  claiming: boolean
  returnPath: string
  focusRef: FocusRef
}) {
  const { t } = useI18n()
  if (signIn)
    return (
      <Notice
        title={t('Sign in again to claim')}
        body={t('Your session has ended. Your offer is still saved.')}
      >
        <Link
          ref={focusRef}
          href={`/login?returnUrl=${encodeURIComponent(returnPath)}`}
          onClick={leaveWelcomeOffer}
          className={`${primaryButton} w-full`}
        >
          {t('Sign in')}
        </Link>
        <button
          type="button"
          onClick={closeWelcomeOffer}
          className={`${secondaryButton} w-full`}
        >
          {t('Close')}
        </button>
      </Notice>
    )
  return (
    <Notice
      title={t("We couldn't claim your offer")}
      body={t('Check your connection and try again. Your offer is still saved.')}
    >
      <button
        ref={focusRef}
        type="button"
        onClick={() => void claimFromPopup()}
        aria-disabled={claiming || undefined}
        className={`${primaryButton} ${busyButton} w-full`}
      >
        {claiming && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {claiming ? t('Claiming…') : t('Try again')}
      </button>
      <button
        type="button"
        onClick={closeWelcomeOffer}
        className={`${secondaryButton} w-full`}
      >
        {t('Close')}
      </button>
    </Notice>
  )
}

/**
 * The Welcome offer popup. It arrives like a gift: the card rises in, a light sweeps across
 * it once and its lines follow. A claim opens the gift with a flash and confetti, then shows
 * the plan, both after a Claim click and when the popup opens on an automatic claim.
 */
export default function WelcomeOfferDialog({
  state,
}: {
  state: WelcomeOfferState
}) {
  const { t } = useI18n()
  const focusRef: FocusRef = useRef(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const giftRef = useRef<HTMLDivElement>(null)
  const claiming = state.view.step === 'claiming'
  // A Claim or Try again click keeps the step it was made on, with a busy button.
  const shown = useRef(state.view)
  if (!claiming) shown.current = state.view
  const view = shown.current
  // The step the popup opened on; any later step came from a click in it.
  const firstStep = useRef(view.step)
  const arrival = view.step === firstStep.current
  const returnPath = offerHomePath(state.slug)

  const gift = view.step === 'offer' || view.step === 'claimed'
  const claimed = view.step === 'claimed'
  const celebrate = claimed && !view.claim.already_claimed
  const giftSince = useRef(0)
  const [opened, setOpened] = useState(false)
  useEffect(() => {
    giftSince.current = gift ? giftSince.current || performance.now() : 0
  }, [gift])
  useEffect(() => {
    if (!claimed) {
      setOpened(false)
      return
    }
    // Opened right after the gift appears, the card rises first.
    const shownFor = performance.now() - (giftSince.current || performance.now())
    const timer = window.setTimeout(
      () => {
        setOpened(true)
        const box = giftRef.current?.getBoundingClientRect()
        if (celebrate)
          burstConfetti(
            box
              ? { x: box.left + box.width / 2, y: box.top + box.height / 2 }
              : undefined,
            undefined,
            80
          )
      },
      Math.max(OPEN_AFTER_CLICK_MS, OPEN_AFTER_ARRIVAL_MS - shownFor)
    )
    return () => window.clearTimeout(timer)
  }, [claimed, celebrate])

  // A new step morphs the card's height instead of jumping to it. Measured after every
  // render: the dialog mounts the card a commit after this component.
  const measured = useRef<{ step: string; height: number } | null>(null)
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const before = measured.current
    const to = panel.offsetHeight
    measured.current = { step: view.step, height: to }
    if (!before || before.step === view.step || before.height === to) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const from = before.height
    panel.style.overflow = 'hidden'
    const morph = panel.animate([{ height: `${from}px` }, { height: `${to}px` }], {
      duration: 420,
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    })
    const done = () => (panel.style.overflow = '')
    morph.onfinish = done
    morph.oncancel = done
  })

  // A click that moves the popup to another step remounts its content: focus the new step's
  // title, so the answer is read out and focus doesn't fall out of the popup with the old button.
  const stepKey = view.step === 'offer' ? `offer:${state.signedIn}` : view.step
  const focusedStep = useRef(stepKey)
  useEffect(() => {
    if (focusedStep.current === stepKey) return
    focusedStep.current = stepKey
    const title =
      panelRef.current?.querySelector<HTMLElement>('[data-step-title]')
    ;(title ?? focusRef.current)?.focus({ preventScroll: true })
  }, [stepKey])

  // Read out while claiming and the answer a click brought, the same step's again included; a
  // popup that opens on an answer is announced by its title.
  const clicked = useRef(false)
  if (claiming) clicked.current = true
  const answered = clicked.current && !claiming
  let status = ''
  if (claiming) status = t('Claiming…')
  else if (answered && view.step === 'claimed')
    status =
      view.claim.already_claimed && claimEnded(view.claim)
        ? t("You've already claimed this offer")
        : view.claim.already_claimed
          ? t('Already claimed')
          : t('Offer claimed')
  else if (answered && view.step === 'refused')
    status = t(refusalCopy(view.reason).title)
  else if (answered && view.step === 'failed')
    status = view.signIn
      ? t('Sign in again to claim')
      : t("We couldn't claim your offer")

  let content: ReactNode = null
  if (view.step === 'offer' && state.info)
    content = (
      <OfferStep
        state={state}
        info={state.info}
        claiming={claiming}
        returnPath={returnPath}
        focusRef={focusRef}
      />
    )
  else if (view.step === 'claimed')
    content = (
      <ClaimedStep state={state} claim={view.claim} focusRef={focusRef} />
    )
  else if (view.step === 'refused')
    content = (
      <RefusedStep reason={view.reason} focusRef={focusRef} />
    )
  else if (view.step === 'failed')
    content = (
      <FailedStep
        signIn={view.signIn}
        claiming={claiming}
        returnPath={returnPath}
        focusRef={focusRef}
      />
    )
  if (!content) return null

  // When a step's first line rises in: after the card on arrival, at once after a click.
  const linesDelay = !arrival
    ? 60
    : view.step === 'offer'
      ? 180
      : view.step === 'claimed'
        ? 300
        : 100

  return (
    <Dialog
      open
      onClose={closeWelcomeOffer}
      initialFocus={focusRef}
      className="relative z-[70]"
    >
      <div
        className={`${styles.backdrop} fixed inset-0 bg-black/70 backdrop-blur-md`}
        aria-hidden="true"
      />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
          <Dialog.Panel
            ref={panelRef}
            className={`${styles.panel} relative w-full max-w-[420px] rounded-[28px] border border-hairline-strong bg-surface-card/95 p-6 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-7`}
          >
            {gift && (
              <div className={styles.decor} aria-hidden="true">
                <div className={styles.aura} />
                <div className={styles.edge} />
                {firstStep.current === 'offer' && (
                  <div className={styles.sweep} />
                )}
                {opened && <div className={styles.flare} />}
              </div>
            )}
            <button
              type="button"
              onClick={closeWelcomeOffer}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-[13px] text-content-muted transition-colors hover:bg-white/[0.06] hover:text-content sm:right-4 sm:top-4"
              aria-label={t('Close')}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <p role="status" aria-live="polite" className="sr-only">
              {status}
            </p>
            {gift && <GiftMark opened={opened} boxRef={giftRef} />}
            <div
              key={view.step}
              className="relative"
              style={{ '--delay': `${linesDelay}ms` } as CSSProperties}
            >
              {content}
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  )
}
