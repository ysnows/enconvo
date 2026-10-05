import { I18nText } from '@/i18n/I18nText'
import { localizePath, type Locale } from '@/i18n/locale'
import { useI18n } from '@/i18n/I18nProvider'
import styles from '@/styles/Home.module.css'
import compare from '@/styles/PlanComparison.module.css'
import clsx from 'clsx'
import Link from 'next/link'
import { Fragment, useState } from 'react'
import { Button } from '@/components/Button'
import { AffiliateOffer } from '@/components/AffiliateOffer'
import { supabase } from '@/lib/supabase'
import { trackEvent } from '@/lib/analytics'
import { reportAffiliateDownload } from '@/lib/affiliate-journey'

interface CheckIconProps {
  className: string
}

function CheckIcon({ className }: CheckIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={clsx(
        'h-6 w-6 flex-none fill-current stroke-current',
        className
      )}
    >
      <path
        d="M9.307 12.248a.75.75 0 1 0-1.114 1.004l1.114-1.004ZM11 15.25l-.557.502a.75.75 0 0 0 1.15-.043L11 15.25Zm4.844-5.041a.75.75 0 0 0-1.188-.918l1.188.918Zm-7.651 3.043 2.25 2.5 1.114-1.004-2.25-2.5-1.114 1.004Zm3.4 2.457 4.25-5.5-1.187-.918-4.25 5.5 1.188.918Z"
        strokeWidth={0}
      />
      <circle
        cx={12}
        cy={12}
        r={8.25}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

async function startCheckout(
  lookupKey: string,
  setIsLoading: (loading: boolean) => void,
  locale: Locale,
  extra?: Record<string, unknown>,
  placement: 'plan_card' | 'comparison' = 'plan_card'
) {
  try {
    setIsLoading(true)
    if (lookupKey === 'free') {
      trackEvent('download_click', { arch: 'auto', placement: 'pricing_free' })
      reportAffiliateDownload()
      window.location.href = 'https://api.enconvo.com/app/download'
      return
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()
    trackEvent('begin_checkout', {
      plan: lookupKey,
      placement,
      signed_in: Boolean(session),
    })

    if (!session) {
      const returnUrl = `/pricing?plan=${lookupKey}`
      window.location.href = localizePath(
        `/login?returnUrl=${encodeURIComponent(returnUrl)}`,
        locale
      )
      return
    }

    const response = await fetch('/api/subscription/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lookupKey,
        locale,
        email: session.user.email,
        ...extra,
      }),
    })

    if (response.status === 200) {
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } else {
      const error = await response.json()
      console.error('Payment error:', error)
    }
  } catch (error) {
    console.error('Error initiating checkout:', error)
  } finally {
    setIsLoading(false)
  }
}

interface PlanProps {
  name: string
  price: string
  priceNote?: string
  billingNote?: string
  allowance?: string
  lookupKey: string
  badge?: string
  description: string
  startText?: string
  detailsHref?: string
  features: string[]
  featured?: boolean
}

function PlanFeatures({ features }: { features: string[] }) {
  const { t, locale } = useI18n()

  return (
    <ul className={styles.planFeatures}>
      {features.map((feature) => (
        <li key={feature}>
          <CheckIcon className={styles.planCheck} />
          <span>{t(feature)}</span>
        </li>
      ))}
    </ul>
  )
}

function Plan({
  name,
  price,
  priceNote,
  billingNote,
  allowance,
  lookupKey,
  badge,
  description,
  startText = 'Get started',
  detailsHref,
  features,
  featured = false,
}: PlanProps) {
  const { t, locale } = useI18n()

  const [isLoading, setIsLoading] = useState(false)

  return (
    <section
      aria-label={t('{p0} plan', { p0: name })}
      data-spotlight
      className={clsx(styles.planCard, featured && styles.planFeatured)}
    >
      <div className={styles.planIdentity}>
        <div className={styles.planTitleRow}>
          <h4>{t(name)}</h4>
          {badge && <span className={styles.planBadge}>{t(badge)}</span>}
        </div>
        <p>{t(description)}</p>
      </div>
      <div className={styles.planPriceBlock}>
        <div className={styles.planPriceRow}>
          <span className={styles.planAmount}>{price}</span>
          {priceNote && <span className={styles.planUnit}>{t(priceNote)}</span>}
        </div>
        <p className={styles.planBillingNote}>{billingNote || t(' ')}</p>
      </div>
      <div className={styles.planAction}>
        <Button
          onClick={() => startCheckout(lookupKey, setIsLoading, locale)}
          variant={featured ? 'solid' : 'outline'}
          color="white"
          className={styles.planPurchase}
          disabled={isLoading}
          aria-label={
            isLoading
              ? t('Going to checkout...')
              : t('{p0} — {p1}', { p0: t(startText), p1: name })
          }
        >
          {isLoading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {t('Going to checkout...')}
            </>
          ) : (
            <>
              {t(startText)}
              <svg
                className="ml-2 h-4 w-4"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </>
          )}
        </Button>
        {detailsHref && (
          <a
            href={localizePath(detailsHref, locale)}
            className={styles.planDetailsLink}
          >
            {t('See model & service rates')}
          </a>
        )}
      </div>
      {allowance && (
        <p className={styles.planAllowance}>
          <strong>{allowance.split(' points')[0]}</strong>
          <span>{t('points / month')}</span>
        </p>
      )}
      <PlanFeatures features={features} />
    </section>
  )
}

// ---- Plan comparison: what upgrading unlocks, how paid plans differ, and
// every feature with its Free limit. Values mirror the in-app plan picker
// (PlansDialog), the worker's cloudTiers.ts and the sync quotas.

// Free limits; every paid plan (license or Cloud) lifts all of them.
const UNLOCKS: { feature: string; free: string | null; paid: string }[] = [
  { feature: 'Meeting recording', free: '60 min / month', paid: 'Unlimited' },
  { feature: 'Live captions', free: '60 min / month', paid: 'Unlimited' },
  { feature: 'Live Talk', free: '5 min / month', paid: 'Unlimited' },
  { feature: 'Knowledge bases', free: '1', paid: 'Unlimited' },
  { feature: 'Workflows', free: '1', paid: 'Unlimited' },
  { feature: 'Scheduled tasks', free: '1 active', paid: 'Unlimited' },
  { feature: 'IM bots', free: '1 running', paid: 'Unlimited' },
  {
    feature: 'Use your Mac from your phone (Remote)',
    free: null,
    paid: 'Included',
  },
  { feature: 'Avatar on iPhone & Android', free: null, paid: 'Included' },
  { feature: 'Sync across Macs', free: null, paid: 'Included' },
]

type PaidPlan = {
  name: string
  kind: 'License' | 'Cloud'
  best: string
  featured?: boolean
}

// Column order for the paid-plan table; Cloud prices come from CLOUD_TIERS.
const PAID_PLANS: PaidPlan[] = [
  { name: 'Standard', kind: 'License', best: 'One Mac, your own API keys.' },
  {
    name: 'Premium',
    kind: 'License',
    best: 'Lifetime updates on up to 3 Macs.',
  },
  {
    name: 'Teams',
    kind: 'License',
    best: 'One account for a team, +$20 a seat.',
  },
  { name: 'Plus', kind: 'Cloud', best: 'Light daily use, no API keys.' },
  {
    name: 'Pro',
    kind: 'Cloud',
    best: 'Heavy daily use and agents.',
    featured: true,
  },
  { name: 'Max', kind: 'Cloud', best: 'All-day agents and long tasks.' },
]

// A cell is text plus an optional meter: `bar` is a 0–100 fill, `dots` a
// 1–5 count. `strong` marks a step up worth noticing.
type DiffCell = {
  text: string
  bar?: number
  dots?: number
  strong?: boolean
  tone?: 'muted' | 'good'
}
const PLAN_DIFFS: { feature: string; hint: string; cells: DiffCell[] }[] = [
  {
    feature: 'Cloud points',
    hint: 'For Cloud models and services',
    cells: [
      { text: '50,000 bonus', bar: 12 },
      { text: '150,000 bonus', bar: 30, strong: true },
      { text: '50,000 / seat', bar: 12 },
      { text: '500K / month', bar: 50, strong: true },
      { text: '2.5M / month', bar: 85, strong: true },
      { text: '5M / month', bar: 100, strong: true },
    ],
  },
  {
    feature: 'Model discounts',
    hint: 'DeepSeek, MiniMax M3 & GLM-5.3-Flash',
    cells: [
      { text: 'Standard rate', tone: 'muted' },
      { text: 'Standard rate', tone: 'muted' },
      { text: 'Standard rate', tone: 'muted' },
      { text: 'Standard rate', tone: 'muted' },
      { text: '1/2 price', strong: true, tone: 'good' },
      { text: '1/4 price', strong: true, tone: 'good' },
    ],
  },
  {
    feature: 'Mac devices',
    hint: 'Signed in at the same time',
    cells: [
      { text: '1', dots: 1 },
      { text: '3', dots: 3, strong: true },
      { text: '5 – 500', dots: 5, strong: true },
      { text: '5', dots: 5 },
      { text: '5', dots: 5 },
      { text: '5', dots: 5 },
    ],
  },
  {
    feature: 'Sync storage',
    hint: 'Chats, settings & knowledge across Macs',
    cells: [
      { text: '50 MB', bar: 50 },
      { text: '100 MB', bar: 100, strong: true },
      { text: '100 MB', bar: 100 },
      { text: '100 MB', bar: 100 },
      { text: '100 MB', bar: 100 },
      { text: '100 MB', bar: 100 },
    ],
  },
  {
    feature: 'Updates & support',
    hint: 'New versions of Enconvo',
    cells: [
      { text: '1 year of updates' },
      { text: 'Lifetime updates', strong: true },
      { text: 'Lifetime updates' },
      { text: 'Updates + priority support', strong: true },
      { text: 'Updates + priority support' },
      { text: 'Updates + priority support' },
    ],
  },
]

// `free` is how Free gets the feature: every plan, a limit, or paid only.
type Access =
  | { kind: 'all' }
  | { kind: 'limit'; limit: string }
  | { kind: 'paid' }
const ALL: Access = { kind: 'all' }
const PAID: Access = { kind: 'paid' }
const limit = (value: string): Access => ({ kind: 'limit', limit: value })

const FEATURE_GROUPS: {
  title: string
  subtitle: string
  icon: string
  items: { name: string; description: string; access: Access }[]
}[] = [
  {
    title: 'AI & Agents',
    subtitle: 'Any model, one assistant',
    icon: 'M4 5h16v11H9l-5 4zM9 10h.01M12 10h.01M15 10h.01',
    items: [
      {
        name: 'Chat with any model',
        description:
          '20+ providers — OpenAI, Claude, Gemini, DeepSeek — unlimited with your own key.',
        access: ALL,
      },
      {
        name: 'Local models',
        description: 'Ollama, LM Studio and MLX, fully offline.',
        access: ALL,
      },
      {
        name: 'Agent mode',
        description:
          'Plans, uses tools and skills, and finishes multi-step tasks.',
        access: ALL,
      },
      {
        name: 'MCP, plugins & skills',
        description: '100+ built-in tools, MCP servers and your own skills.',
        access: ALL,
      },
    ],
  },
  {
    title: 'Computer & Browser Use',
    subtitle: 'Agents that do the clicking',
    icon: 'M5 3l13 7-5.5 1.8L10.5 18zM13 13l5 5',
    items: [
      {
        name: 'Computer Use',
        description:
          'Agents operate your Mac apps — click, type, read the screen.',
        access: ALL,
      },
      {
        name: 'Browser Use',
        description:
          'Agents navigate, fill in forms and download in your browser.',
        access: ALL,
      },
    ],
  },
  {
    title: 'Everywhere on your Mac',
    subtitle: 'One shortcut away',
    icon: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
    items: [
      {
        name: 'SmartBar, PopBar & App Sidebar',
        description:
          'Ask about any selection or app without switching windows.',
        access: ALL,
      },
      {
        name: 'Dynamic Island',
        description: 'Live status and quick replies at the top of your screen.',
        access: ALL,
      },
      {
        name: 'Screenshot, OCR & Screen Doodle',
        description: 'Capture, read text from and mark up anything on screen.',
        access: ALL,
      },
    ],
  },
  {
    title: 'Voice & Meetings',
    subtitle: 'Talk instead of type',
    icon: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
    items: [
      {
        name: 'Dictation & voice commands',
        description: 'Speak into any app, or tell Enconvo what to do.',
        access: ALL,
      },
      {
        name: 'Read aloud',
        description: 'Natural voices for any text.',
        access: ALL,
      },
      {
        name: 'Meeting recording',
        description: 'Record, transcribe and summarize meetings.',
        access: limit('60 min / month'),
      },
      {
        name: 'Live captions',
        description: 'Real-time captions and translation for any audio.',
        access: limit('60 min / month'),
      },
      {
        name: 'Live Talk',
        description: 'Real-time voice conversations with AI.',
        access: limit('5 min / month'),
      },
    ],
  },
  {
    title: 'Knowledge & Memory',
    subtitle: 'Answers from your own files',
    icon: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
    items: [
      {
        name: 'Knowledge bases',
        description: 'Chat with your documents, notes and folders.',
        access: limit('1'),
      },
      {
        name: 'Memory',
        description: 'Enconvo remembers your preferences and context.',
        access: ALL,
      },
    ],
  },
  {
    title: 'Automation',
    subtitle: 'Work that runs on its own',
    icon: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
    items: [
      {
        name: 'Workflows',
        description: 'Chain steps and tools on a visual canvas.',
        access: limit('1'),
      },
      {
        name: 'Scheduled tasks',
        description: 'Run agents and workflows on a schedule.',
        access: limit('1 active'),
      },
      {
        name: 'IM bots',
        description: 'Your assistant in Telegram, Discord, Slack and Lark.',
        access: limit('1 running'),
      },
    ],
  },
  {
    title: 'Phone & Sync',
    subtitle: 'Your Mac, wherever you are',
    icon: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2',
    items: [
      {
        name: 'iPhone & Android app',
        description: 'Chat with your Mac’s assistant on the go.',
        access: ALL,
      },
      {
        name: 'Remote',
        description: 'Use your Mac from your phone.',
        access: PAID,
      },
      {
        name: 'Avatar',
        description: 'A live character for voice chats on your phone.',
        access: PAID,
      },
      {
        name: 'Sync across Macs',
        description:
          'Chats, settings and knowledge bases stay the same on every Mac.',
        access: PAID,
      },
    ],
  },
]

function AccessTag({ access }: { access: Access }) {
  const { t } = useI18n()
  if (access.kind === 'all')
    return (
      <span className={clsx(compare.tag, compare.tagAll)}>
        {t('Every plan')}
      </span>
    )
  if (access.kind === 'paid')
    return (
      <span className={clsx(compare.tag, compare.tagPaid)}>
        {t('Paid plans')}
      </span>
    )
  return (
    <span className={clsx(compare.tag, compare.tagLimit)}>
      {t('Free: {p0}', { p0: t(access.limit) })}
    </span>
  )
}

function TickIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

function PlanCheckoutButton({
  lookupKey,
  label,
  planName,
  featured,
}: {
  lookupKey: string
  label: string
  planName: string
  featured?: boolean
}) {
  const { t, locale } = useI18n()
  const [isLoading, setIsLoading] = useState(false)
  return (
    <button
      type="button"
      className={clsx(compare.planCta, featured && compare.planCtaFeatured)}
      disabled={isLoading}
      aria-label={t('{p0} — {p1}', { p0: t(label), p1: planName })}
      onClick={() =>
        startCheckout(lookupKey, setIsLoading, locale, undefined, 'comparison')
      }
    >
      {isLoading ? t('Going to checkout...') : t(label)}
    </button>
  )
}

function PlanComparison({ billing }: { billing: 'monthly' | 'annual' }) {
  const { t } = useI18n()
  const isAnnual = billing === 'annual'

  return (
    <div className={compare.root}>
      <section className={compare.block} aria-labelledby="compare-unlocks">
        <div className={compare.blockHeading}>
          <h3 id="compare-unlocks">{t('What upgrading unlocks')}</h3>
          <p>
            {t(
              'Free has every feature below, with these limits. Any paid plan removes all of them.'
            )}
          </p>
        </div>
        <div className={compare.unlockGrid}>
          <div className={compare.unlockCard}>
            <div className={compare.unlockHead}>
              <span>{t('Free')}</span>
              <span>{t('$0, forever')}</span>
            </div>
            <ul>
              {UNLOCKS.map((row) => (
                <li key={row.feature}>
                  <span>{t(row.feature)}</span>
                  {row.free ? (
                    <span className={clsx(compare.tag, compare.tagLimit)}>
                      {t(row.free)}
                    </span>
                  ) : (
                    <span className={compare.notIncluded}>
                      {t('Not included')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className={clsx(compare.unlockCard, compare.unlockPaid)}>
            <div className={compare.unlockHead}>
              <span>{t('Any paid plan')}</span>
              <span>{t('from $49 once or $10 / month')}</span>
            </div>
            <ul>
              {UNLOCKS.map((row) => (
                <li key={row.feature}>
                  <span>{t(row.feature)}</span>
                  <span className={compare.paidValue}>
                    <TickIcon className={compare.tick} />
                    {t(row.paid)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={compare.block} aria-labelledby="compare-paid">
        <div className={clsx(compare.blockHeading, compare.blockHeadingSplit)}>
          <div>
            <h3 id="compare-paid">{t('How paid plans differ')}</h3>
            <p>
              {t(
                'Same features on all six plans. Only these five things change.'
              )}
            </p>
          </div>
          <div className={compare.legend}>
            <span className={compare.tag}>
              {t('One-time license: you bring the AI')}
            </span>
            <span className={clsx(compare.tag, compare.tagPaid)}>
              {t('Cloud plan: AI included')}
            </span>
          </div>
        </div>
        <div
          className={compare.tableScroll}
          tabIndex={0}
          role="region"
          aria-label={t('How paid plans differ')}
        >
          <table className={compare.table}>
            <thead>
              <tr>
                <th scope="col" className={compare.corner}>
                  <span className="sr-only">{t('Plan')}</span>
                </th>
                {PAID_PLANS.map((plan, i) => {
                  const tier = CLOUD_TIERS.find((c) => c.name === plan.name)
                  const price = tier
                    ? isAnnual
                      ? tier.annual.perMonth
                      : tier.monthly.price
                    : plan.name === 'Teams'
                    ? `$${teamsPrice(TEAMS_MIN_SEATS)}`
                    : plan.name === 'Premium'
                    ? '$99'
                    : '$49'
                  const note = tier
                    ? isAnnual
                      ? '/mo · billed yearly'
                      : '/month'
                    : plan.name === 'Teams'
                    ? 'once · 5 seats'
                    : 'once'
                  return (
                    <th
                      key={plan.name}
                      scope="col"
                      data-featured={plan.featured || undefined}
                      data-group-start={i === 3 || undefined}
                      className={compare.planHead}
                    >
                      <div className={compare.planBadgeSlot}>
                        {plan.featured && (
                          <span className={clsx(compare.tag, compare.tagPaid)}>
                            {t('Most popular')}
                          </span>
                        )}
                      </div>
                      <p
                        className={compare.planKind}
                        data-cloud={plan.kind === 'Cloud' || undefined}
                      >
                        {t(plan.kind)}
                      </p>
                      <p className={compare.planName}>{t(plan.name)}</p>
                      <p className={compare.planPrice}>
                        <strong>{price}</strong>
                        <span>{t(note)}</span>
                      </p>
                      <p className={compare.planBest}>{t(plan.best)}</p>
                    </th>
                  )
                })}
              </tr>
              <tr>
                <td className={compare.ctaCorner} />
                {PAID_PLANS.map((plan, i) => {
                  const tier = CLOUD_TIERS.find((c) => c.name === plan.name)
                  return (
                    <td
                      key={plan.name}
                      data-featured={plan.featured || undefined}
                      data-group-start={i === 3 || undefined}
                      className={compare.planCtaCell}
                    >
                      {plan.name === 'Teams' ? (
                        <a href="#pricing-teams" className={compare.planCta}>
                          {t('Choose seats')}
                        </a>
                      ) : (
                        <PlanCheckoutButton
                          lookupKey={
                            tier
                              ? isAnnual
                                ? tier.annual.lookupKey
                                : tier.monthly.lookupKey
                              : plan.name.toLowerCase()
                          }
                          label={tier ? 'Subscribe' : 'Buy License'}
                          planName={plan.name}
                          featured={plan.featured}
                        />
                      )}
                    </td>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {PLAN_DIFFS.map((row) => (
                <tr key={row.feature}>
                  <th scope="row" className={compare.rowHead}>
                    <span>{t(row.feature)}</span>
                    <span>{t(row.hint)}</span>
                  </th>
                  {row.cells.map((cell, i) => (
                    <td
                      key={i}
                      data-featured={PAID_PLANS[i].featured || undefined}
                      data-group-start={i === 3 || undefined}
                      data-cloud={PAID_PLANS[i].kind === 'Cloud' || undefined}
                    >
                      <span
                        className={compare.cellText}
                        data-strong={cell.strong || undefined}
                        data-tone={cell.tone}
                      >
                        {t(cell.text)}
                      </span>
                      {cell.bar !== undefined && (
                        <span className={compare.meter} aria-hidden="true">
                          <span style={{ width: `${cell.bar}%` }} />
                        </span>
                      )}
                      {cell.dots !== undefined && (
                        <span className={compare.dots} aria-hidden="true">
                          {[1, 2, 3, 4, 5].map((d) => (
                            <span
                              key={d}
                              data-on={d <= cell.dots! || undefined}
                            />
                          ))}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={compare.block} aria-labelledby="compare-features">
        <div className={clsx(compare.blockHeading, compare.blockHeadingSplit)}>
          <div>
            <h3 id="compare-features">{t('What you get with Enconvo')}</h3>
            <p>
              {t(
                'Most of Enconvo is on every plan, Free included. Tags show where Free has a limit.'
              )}
            </p>
          </div>
          <div className={compare.legend}>
            <span className={clsx(compare.tag, compare.tagAll)}>
              {t('Every plan')}
            </span>
            <span className={clsx(compare.tag, compare.tagLimit)}>
              {t('Free has a limit')}
            </span>
            <span className={clsx(compare.tag, compare.tagPaid)}>
              {t('Paid plans')}
            </span>
          </div>
        </div>
        <div className={compare.featureGrid}>
          {FEATURE_GROUPS.map((group) => (
            <div key={group.title} className={compare.featureCard}>
              <div className={compare.featureHead}>
                <span className={compare.featureIcon}>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={group.icon} />
                  </svg>
                </span>
                <div>
                  <h4>{t(group.title)}</h4>
                  <p>{t(group.subtitle)}</p>
                </div>
              </div>
              <ul>
                {group.items.map((item) => (
                  <li key={item.name}>
                    <div>
                      <span>{t(item.name)}</span>
                      <span>{t(item.description)}</span>
                    </div>
                    <AccessTag access={item.access} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// Teams lifetime license (ADR 0036): one account, seat-counted devices.
// Price anchors to the single-user Premium: $99 + (seats − 3) × $20.
const TEAMS_MIN_SEATS = 5
const TEAMS_MAX_SEATS = 500
const teamsPrice = (seats: number) => 99 + (seats - 3) * 20

function TeamsPlan() {
  const { t, locale } = useI18n()

  const [seats, setSeats] = useState(TEAMS_MIN_SEATS)
  const [isLoading, setIsLoading] = useState(false)

  const clamp = (n: number) =>
    Math.min(
      TEAMS_MAX_SEATS,
      Math.max(TEAMS_MIN_SEATS, Math.floor(n) || TEAMS_MIN_SEATS)
    )

  return (
    <section
      id="pricing-teams"
      style={{ scrollMarginTop: 96 }}
      aria-label={t('Teams plan')}
      data-spotlight
      className={`${styles.planCard} ${styles.teamsPlan}`}
    >
      <div className={styles.teamsTop}>
        <div className={styles.planIdentity}>
          <h4>{t('Teams')}</h4>
          <p>
            {t('One account for your whole team. 30-day money back guarantee.')}
          </p>
        </div>
        <div className={styles.teamsControls}>
          <div className={styles.teamsSeats}>
            <label htmlFor="pricing-team-seats">{t('Seats')}</label>
            <div className={styles.seatStepper}>
              <button
                type="button"
                aria-label={t('Fewer seats')}
                onClick={() => setSeats((s) => clamp(s - 1))}
                disabled={seats <= TEAMS_MIN_SEATS}
              >
                −
              </button>
              <input
                id="pricing-team-seats"
                type="number"
                min={TEAMS_MIN_SEATS}
                max={TEAMS_MAX_SEATS}
                value={seats}
                onChange={(e) => setSeats(clamp(Number(e.target.value)))}
              />
              <button
                type="button"
                aria-label={t('More seats')}
                onClick={() => setSeats((s) => clamp(s + 1))}
                disabled={seats >= TEAMS_MAX_SEATS}
              >
                +
              </button>
            </div>
          </div>
          <div
            className={styles.teamsQuote}
            aria-live="polite"
            aria-atomic="true"
          >
            <span className={styles.planAmount}>
              ${teamsPrice(seats).toLocaleString()}
            </span>
            <p className={styles.planBillingNote}>
              <I18nText
                source={'one-time · ${p0}/seat'}
                values={{ p0: (teamsPrice(seats) / seats).toFixed(2) }}
              />
            </p>
          </div>
          <Button
            onClick={() =>
              startCheckout('teams', setIsLoading, locale, { seats })
            }
            variant="outline"
            color="white"
            className={styles.planPurchase}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t('Going to checkout...')}
              </>
            ) : (
              t('Buy Teams License')
            )}
          </Button>
        </div>
      </div>
      <PlanFeatures
        features={[
          `${seats} Mac devices on one account`,
          `${(
            seats * 50000
          ).toLocaleString()} Cloud points bonus — 50,000 per seat`,
          'Add more seats any time at $20 each',
          'Lifetime free updates',
        ]}
      />
    </section>
  )
}

interface CloudTier {
  name: string
  description: string
  badge?: string
  featured?: boolean
  monthly: { price: string; lookupKey: string }
  annual: { price: string; perMonth: string; lookupKey: string }
  features: string[]
}

// Tier data mirrors the in-app plan picker (PlansDialog / worker cloudTiers).
const CLOUD_TIERS: CloudTier[] = [
  {
    name: 'Plus',
    description: 'No API keys — points included.',
    monthly: { price: '$10', lookupKey: 'monthly' },
    annual: { price: '$96', perMonth: '$8', lookupKey: 'yearly' },
    features: [
      '500,000 points / month',
      'Every Cloud model & service — chat, image, TTS, transcription',
      'Latest frontier models — GPT, Claude, Gemini & more',
      'No API keys needed',
      '5 Mac devices',
      'Priority support',
    ],
  },
  {
    name: 'Pro',
    description: 'DeepSeek, MiniMax M3 & GLM-5.3-Flash at half price.',
    badge: 'Most popular',
    featured: true,
    monthly: { price: '$50', lookupKey: 'pro_monthly' },
    annual: { price: '$480', perMonth: '$40', lookupKey: 'pro_yearly' },
    features: [
      '2,500,000 points / month',
      '⚡ DeepSeek, MiniMax M3 & GLM-5.3-Flash at 1/2 price — up to 5M points of usage',
      'Every Cloud model & service — chat, image, TTS, transcription',
      'Latest frontier models — GPT, Claude, Gemini & more',
      'No API keys needed',
      '5 Mac devices',
      'Priority support',
    ],
  },
  {
    name: 'Max',
    description: 'DeepSeek, MiniMax M3 & GLM-5.3-Flash at quarter price.',
    monthly: { price: '$100', lookupKey: 'max_monthly' },
    annual: { price: '$960', perMonth: '$80', lookupKey: 'max_yearly' },
    features: [
      '5,000,000 points / month',
      '⚡ DeepSeek, MiniMax M3 & GLM-5.3-Flash at 1/4 price — up to 20M points of usage',
      'Every Cloud model & service — chat, image, TTS, transcription',
      'Latest frontier models — GPT, Claude, Gemini & more',
      'No API keys needed',
      '5 Mac devices',
      'Priority support',
    ],
  },
]

export function Pricing() {
  const { t, locale } = useI18n()

  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  return (
    <section
      id="pricing"
      aria-label={t('Pricing')}
      className={`${styles.section} ${styles.pricingSection}`}
    >
      <div className={`${styles.sectionContainer} mx-auto`}>
        <div className={styles.pricingHeading} data-reveal>
          <p className={styles.pricingEyebrow}>{t('Pricing')}</p>
          <h2 className="font-display text-3xl tracking-tight text-content sm:text-4xl">
            {t('Simple pricing, for everyone.')}
          </h2>
          <p className="mt-4 text-lg text-content-muted">
            {t('Two ways to pay for AI — and they stack.')}
          </p>
        </div>

        <AffiliateOffer />

        <div className={styles.pricingGroup}>
          <div className={styles.pricingGroupHeading} data-reveal>
            <span className={styles.pricingKind}>{t('One-time purchase')}</span>
            <h3 className="font-display text-xl font-semibold text-content">
              {t('You bring the AI')}
            </h3>
            <p className="mt-2 text-sm text-content-muted">
              {t(
                'Use your own API keys or local models — AI usage is free and unlimited on every tier.'
              )}
            </p>
          </div>

          <div className={styles.licenseGrid} data-reveal>
            <Plan
              name="Standard"
              price="$49"
              priceNote="one-time"
              lookupKey={'standard'}
              description={t('30-day money back guarantee.')}
              startText="Buy License"
              features={[
                'Unlimited AI with your own API key',
                'Unlimited knowledge bases & workflows',
                'Use your Mac from your phone (Remote)',
                '50,000 Cloud points bonus',
                '1 year of free updates',
                '1 Mac device',
              ]}
            />

            <Plan
              name="Premium"
              price="$99"
              priceNote="one-time"
              lookupKey={'premium'}
              description={t('30-day money back guarantee.')}
              startText="Buy License"
              features={[
                'Everything in Standard',
                '150,000 Cloud points bonus',
                'Lifetime free updates',
                '3 Mac devices',
              ]}
            />
          </div>
          <TeamsPlan />
        </div>

        <div className={`${styles.pricingGroup} ${styles.cloudGroup}`}>
          <div className={styles.pricingGroupHeading} data-reveal>
            <span className={styles.pricingKind}>{t('Monthly or annual')}</span>
            <h3 className="font-display text-xl font-semibold text-content">
              {t('Enconvo Cloud Plan')}
            </h3>
            <p className="mt-2 text-sm text-content-muted">
              {t(
                'No API keys. A monthly point allowance powers every model and service.'
              )}
            </p>
          </div>
          <div className={styles.cloudToolbar}>
            <div
              className={styles.billingToggle}
              role="group"
              aria-label={t('Cloud billing period')}
            >
              <button
                type="button"
                onClick={() => setBilling('monthly')}
                aria-pressed={billing === 'monthly'}
              >
                {t('Monthly')}
              </button>
              <button
                type="button"
                onClick={() => setBilling('annual')}
                aria-pressed={billing === 'annual'}
              >
                {t('Annual')}
                <span className={styles.billingSaving}>−20%</span>
              </button>
            </div>
            <Link href="/cloud-pricing" className={styles.pricingRates}>
              {t('See model & service rates ')}
              <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <div className={styles.cloudGrid} data-reveal>
            {CLOUD_TIERS.map((tier) => {
              const isAnnual = billing === 'annual'
              return (
                <Plan
                  key={tier.name}
                  name={tier.name}
                  price={isAnnual ? tier.annual.perMonth : tier.monthly.price}
                  priceNote={isAnnual ? '/mo' : '/month'}
                  billingNote={
                    isAnnual ? `billed ${tier.annual.price}/year` : undefined
                  }
                  allowance={tier.features[0]}
                  lookupKey={
                    isAnnual ? tier.annual.lookupKey : tier.monthly.lookupKey
                  }
                  badge={tier.badge}
                  featured={tier.featured}
                  description={t(tier.description)}
                  features={tier.features.slice(1)}
                />
              )
            })}
          </div>
        </div>

        <PlanComparison billing={billing} />

        <div className={styles.pricingFooter}>
          <p className="text-sm text-content-muted">
            {t(
              'Licenses and Cloud plans stack — a Lifetime owner can add any Cloud plan for included points, and every plan keeps own-key usage unlimited.'
            )}
          </p>
          <p className="mt-2 text-sm text-content-muted">
            <I18nText
              source={'Need more than 500 seats or private deployment? {p0} .'}
              values={{
                p0: (
                  <a
                    href="mailto:support@enconvo.com"
                    className="text-content-muted underline underline-offset-2 transition hover:text-content"
                  >
                    {t('Contact us')}
                  </a>
                ),
              }}
            />
          </p>
        </div>
      </div>
    </section>
  )
}
