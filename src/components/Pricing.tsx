import { I18nText } from '@/i18n/I18nText'
import { localizePath, type Locale } from '@/i18n/locale'
import { useI18n } from '@/i18n/I18nProvider'
import auroraBloom from '@/images/hero-aurora-bloom.webp'
import styles from '@/styles/Home.module.css'
import compare from '@/styles/PlanComparison.module.css'
import cards from '@/styles/PricingCards.module.css'
import clsx from 'clsx'
import Link from 'next/link'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { AffiliateOffer } from '@/components/AffiliateOffer'
import { trackEvent } from '@/lib/analytics'
import { reportAffiliateDownload } from '@/lib/affiliate-journey'
import { reportCampaignDownload } from '@/lib/campaign-journey'
import {
  lifetimePrices,
  lifetimeSale,
  saleCents,
  TEAMS_BASE_SEATS,
  teamsCents,
  usd,
} from '@/lib/lifetime-pricing'

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
      trackEvent('download_click', {
        arch: 'auto',
        placement:
          placement === 'comparison' ? 'pricing_comparison' : 'pricing_free',
      })
      reportAffiliateDownload()
      reportCampaignDownload()
      window.location.href = 'https://api.enconvo.com/app/download'
      return
    }

    // Loaded on demand, like SiteNav's: the client stays out of the homepage's first load.
    const { supabase } = await import('@/lib/supabase')
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

interface Renewal {
  /** What each renewal charges before tax, e.g. `$96`. */
  amount: string
  period: 'month' | 'year'
}

interface PlanProps {
  name: string
  price: string
  wasPrice?: string
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
  /** A subscription's renewal, stated under its button. */
  renewal?: Renewal
}

// The auto-renewal terms under a Cloud plan's button: what renews, how to cancel and when
// cancelling takes effect (the billing portal cancels at the end of the paid period). In the
// comparison table, `compact` keeps each column to its amount, and the table's foot says the
// rest once. Checkout repeats them beside Stripe's Subscribe button (lib/renewal-terms.ts).
function RenewalTerms({
  amount,
  period,
  compact = false,
  className,
}: Renewal & { compact?: boolean; className: string }) {
  const { t } = useI18n()
  const values = { p0: amount }
  const text = compact
    ? period === 'year'
      ? t('Auto-renews at {p0}/year plus tax.', values)
      : t('Auto-renews at {p0}/month plus tax.', values)
    : period === 'year'
    ? t(
        'Renews automatically at {p0}/year plus tax until you cancel. Cancel anytime under Manage billing in your account; the plan stays active until the end of the paid year.',
        values
      )
    : t(
        'Renews automatically at {p0}/month plus tax until you cancel. Cancel anytime under Manage billing in your account; the plan stays active until the end of the paid month.',
        values
      )
  return <p className={className}>{text}</p>
}

// ---- Plan comparison: how the seven plans differ, and every feature with its Free
// limit. Values mirror the in-app plan picker (PlansDialog), the worker's
// cloudTiers.ts and the sync quotas.

// The two Pricing dimension groups. The names are catalog keys.
type PlanGroup = 'You bring the AI' | 'We bring the AI'
const PLAN_GROUPS: { id: PlanGroup }[] = [
  { id: 'You bring the AI' },
  { id: 'We bring the AI' },
]

type PlanColumn = {
  name: string
  group: PlanGroup
  best: string
  featured?: boolean
}

// Column order for the table; Cloud prices come from CLOUD_TIERS.
const PLAN_COLUMNS: PlanColumn[] = [
  {
    name: 'Free',
    group: 'You bring the AI',
    best: 'Most of Enconvo, on your own keys.',
  },
  {
    name: 'Standard',
    group: 'You bring the AI',
    best: 'One Mac, your own API keys.',
  },
  {
    name: 'Premium',
    group: 'You bring the AI',
    best: 'Lifetime updates on up to 3 Macs.',
  },
  {
    name: 'Teams',
    group: 'You bring the AI',
    // {p0} is the seat price on the lifetime schedule.
    best: 'One account per person, +{p0} a seat.',
  },
  {
    name: 'Plus',
    group: 'We bring the AI',
    best: 'Light daily use, no API keys.',
  },
  {
    name: 'Pro',
    group: 'We bring the AI',
    best: 'Heavy daily use and agents.',
    featured: true,
  },
  {
    name: 'Max',
    group: 'We bring the AI',
    best: 'All-day agents and long tasks.',
  },
]

type DiffCell =
  | { kind: 'included' }
  | { kind: 'none' }
  | {
      kind: 'value'
      text: string
      unit?: string
      unitValues?: Record<string, string>
      tone?: 'good' | 'limit'
    }
const INCLUDED: DiffCell = { kind: 'included' }
const NONE: DiffCell = { kind: 'none' }
const amount = (text: string, unit?: string): DiffCell => ({
  kind: 'value',
  text,
  unit,
})

// One cell per PLAN_COLUMNS entry, in its order.
const PLAN_DIFFS: { feature: string; hint?: string; cells: DiffCell[] }[] = [
  {
    feature: 'All features',
    hint: 'Free has limits, listed below',
    cells: [
      { kind: 'value', text: 'Has limits', tone: 'limit' },
      INCLUDED,
      INCLUDED,
      INCLUDED,
      INCLUDED,
      INCLUDED,
      INCLUDED,
    ],
  },
  {
    feature: 'Cloud points',
    hint: 'For Cloud models and services',
    cells: [
      amount('5,000', 'once'),
      amount('50,000', 'bonus'),
      amount('150,000', 'bonus'),
      amount('50,000', 'per seat'),
      amount('500K', 'a month'),
      amount('2.5M', 'a month'),
      amount('5M', 'a month'),
    ],
  },
  {
    feature: 'Model discounts',
    hint: 'DeepSeek, MiniMax M3/M3.1 Flash & GLM-5.3-Flash',
    cells: [
      NONE,
      NONE,
      NONE,
      NONE,
      NONE,
      {
        kind: 'value',
        text: '1/2 price',
        unit: 'up to {p0} points',
        unitValues: { p0: '5M' },
        tone: 'good',
      },
      {
        kind: 'value',
        text: '1/4 price',
        unit: 'up to {p0} points',
        unitValues: { p0: '20M' },
        tone: 'good',
      },
    ],
  },
  {
    feature: 'Mac devices',
    hint: 'Signed in at the same time',
    cells: [
      amount('1'),
      amount('1'),
      amount('3'),
      amount('1', 'per seat'),
      amount('5'),
      amount('5'),
      amount('5'),
    ],
  },
  {
    feature: 'Sync storage',
    hint: 'Chats, settings & knowledge across Macs',
    cells: [
      NONE,
      amount('50 MB'),
      amount('100 MB'),
      amount('100 MB'),
      amount('100 MB'),
      amount('100 MB'),
      amount('100 MB'),
    ],
  },
  {
    feature: 'Updates',
    hint: 'New versions of Enconvo',
    cells: [
      NONE,
      amount('1 year'),
      amount('Lifetime'),
      amount('Lifetime'),
      INCLUDED,
      INCLUDED,
      INCLUDED,
    ],
  },
  {
    feature: 'Priority support',
    cells: [NONE, NONE, NONE, NONE, INCLUDED, INCLUDED, INCLUDED],
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

// `span` is the card's width out of twelve and `columns` how its items are laid out: two
// cards in a row hold the same number of item rows, so neither has empty space.
const FEATURE_GROUPS: {
  title: string
  subtitle: string
  icon: string
  span: number
  columns: number
  items: { name: string; description: string; access: Access }[]
}[] = [
  {
    title: 'AI & Agents',
    subtitle: 'Any model, one assistant',
    icon: 'M4 5h16v11H9l-5 4zM9 10h.01M12 10h.01M15 10h.01',
    span: 7,
    columns: 2,
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
    span: 5,
    columns: 1,
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
    span: 6,
    columns: 1,
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
    title: 'Automation',
    subtitle: 'Work that runs on its own',
    icon: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
    span: 6,
    columns: 1,
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
    title: 'Voice & Meetings',
    subtitle: 'Talk instead of type',
    icon: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
    span: 12,
    columns: 5,
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
    span: 5,
    columns: 1,
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
    title: 'Phone & Sync',
    subtitle: 'Your Mac, wherever you are',
    icon: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2',
    span: 7,
    columns: 2,
    items: [
      {
        name: 'iPhone & Android app',
        description: 'Chat with your Mac’s assistant on the go.',
        access: ALL,
      },
      {
        name: 'Remote',
        description: 'Use your Mac from your phone.',
        access: ALL,
      },
      {
        name: 'Avatar',
        description: 'A live character for voice chats on your phone.',
        access: ALL,
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

// A feature without a tag comes with every plan, Free included.
function AccessTag({ access }: { access: Access }) {
  const { t } = useI18n()
  if (access.kind === 'all') return null
  if (access.kind === 'paid')
    return (
      <span className={clsx(compare.tag, compare.tagPaid)}>
        {t('Paid plans')}
      </span>
    )
  return (
    <span className={compare.tag}>
      {t('Free: {p0}', { p0: t(access.limit) })}
    </span>
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
      aria-label={t('{p0} — {p1}', { p0: t(label), p1: t(planName) })}
      onClick={() =>
        startCheckout(lookupKey, setIsLoading, locale, undefined, 'comparison')
      }
    >
      {isLoading ? <span className={cards.spinner} /> : t(label)}
    </button>
  )
}

function BillingSwitch({
  billing,
  onBilling,
}: {
  billing: 'monthly' | 'annual'
  onBilling: (billing: 'monthly' | 'annual') => void
}) {
  const { t } = useI18n()
  const isAnnual = billing === 'annual'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isAnnual}
      aria-label={t('Annual billing, save 20%')}
      className={cards.switch}
      onClick={() => onBilling(isAnnual ? 'monthly' : 'annual')}
    >
      {t('Annual')} <b>−20%</b>
      <span className={cards.track} />
    </button>
  )
}

function DiffValue({ cell }: { cell: DiffCell }) {
  const { t } = useI18n()
  if (cell.kind === 'none')
    return (
      <span className={compare.none} role="img" aria-label={t('Not included')}>
        —
      </span>
    )
  if (cell.kind === 'included')
    return (
      <svg
        className={compare.check}
        role="img"
        aria-label={t('Included')}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5.5 12.5 10 17l8.5-10" />
      </svg>
    )
  return (
    <>
      <span className={compare.value} data-tone={cell.tone}>
        {t(cell.text)}
      </span>
      {cell.unit && (
        <span className={compare.valueUnit}>
          {t(cell.unit, cell.unitValues)}
        </span>
      )}
    </>
  )
}

function planPrice(plan: PlanColumn, isAnnual: boolean, now: number) {
  if (plan.name === 'Free') return '$0'
  const tier = CLOUD_TIERS.find((item) => item.name === plan.name)
  if (tier) return isAnnual ? tier.annual.perMonth : tier.monthly.price
  const prices = lifetimePrices(now)
  return usd(
    saleCents(
      plan.name === 'Teams'
        ? teamsCents(TEAMS_BASE_SEATS, now)
        : plan.name === 'Premium'
        ? prices.premium.cents
        : prices.standard.cents,
      now
    )
  )
}

function planUnit(plan: PlanColumn, isAnnual: boolean) {
  if (plan.name === 'Free') return 'forever'
  if (plan.name === 'Teams') return 'one-time · 5 seats'
  if (plan.group === 'You bring the AI') return 'one-time'
  return isAnnual ? '/mo · billed yearly' : '/month'
}

function PlanComparison({
  billing,
  onBilling,
  now,
  onChooseTeams,
}: {
  billing: 'monthly' | 'annual'
  onBilling: (billing: 'monthly' | 'annual') => void
  now: number
  onChooseTeams: () => void
}) {
  const { t } = useI18n()
  const [group, setGroup] = useState<PlanGroup>('You bring the AI')
  const isAnnual = billing === 'annual'
  const prices = lifetimePrices(now)
  const shown = PLAN_COLUMNS.filter((plan) => plan.group === group).length

  return (
    <div id="compare" className={compare.root}>
      <section className={compare.block} aria-labelledby="compare-plans">
        <div className={compare.heading}>
          <div>
            <h3 id="compare-plans">{t('How the plans differ')}</h3>
            <p>
              {t(
                'Every paid plan unlocks the same features. They differ in who brings the AI and how much comes with it.'
              )}
            </p>
          </div>
        </div>

        <div
          className={compare.surface}
          style={{ '--shown': shown } as CSSProperties}
        >
          <span className={compare.split} aria-hidden="true" />
          <span className={compare.glow} aria-hidden="true" />

          {/* Too narrow for all seven: one group at a time. */}
          <div className={compare.groupBar}>
            <TierSwitch<PlanGroup>
              label="Plans to compare"
              tabs={PLAN_GROUPS}
              value={group}
              onChange={setGroup}
            />
            {group === 'We bring the AI' && (
              <BillingSwitch billing={billing} onBilling={onBilling} />
            )}
          </div>

          <div role="table" aria-label={t('How the plans differ')}>
            <div className={compare.band} role="row">
              <span role="cell" />
              <div role="columnheader" aria-colspan={4}>
                <CardKind />
              </div>
              <div role="columnheader" aria-colspan={3}>
                <CardKind cloud />
                <BillingSwitch billing={billing} onBilling={onBilling} />
              </div>
            </div>

            <div className={compare.plans} role="row">
              <div className={compare.corner} role="cell">
                <PlusIcon className={compare.cornerIcon} />
                <p>
                  <strong>{t('The two stack')}</strong>
                  {t('Add a Cloud plan to any license, any time.')}
                </p>
              </div>
              {PLAN_COLUMNS.map((plan) => {
                const tier = CLOUD_TIERS.find((c) => c.name === plan.name)
                const price = planPrice(plan, isAnnual, now)
                return (
                  <div
                    key={plan.name}
                    role="columnheader"
                    className={clsx(
                      compare.plan,
                      plan.group !== group && compare.off
                    )}
                  >
                    <p className={compare.planName}>
                      {t(plan.name)}
                      {plan.featured && <i>{t('Popular')}</i>}
                    </p>
                    <p className={compare.planBest}>
                      {t(plan.best, { p0: usd(prices.teams_seat.cents) })}
                    </p>
                    <p
                      className={clsx(
                        compare.planPrice,
                        price.includes('.') && compare.planPriceCents
                      )}
                    >
                      {price}
                    </p>
                    <p className={compare.planUnit}>
                      {t(planUnit(plan, isAnnual))}
                    </p>
                    {plan.name === 'Teams' ? (
                      <a
                        href="#pricing-teams"
                        className={compare.planCta}
                        onClick={onChooseTeams}
                      >
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
                        label={
                          tier
                            ? 'Subscribe'
                            : plan.name === 'Free'
                            ? 'Download'
                            : 'Buy License'
                        }
                        planName={plan.name}
                        featured={plan.featured}
                      />
                    )}
                    {tier ? (
                      <RenewalTerms
                        compact
                        amount={
                          isAnnual ? tier.annual.price : tier.monthly.price
                        }
                        period={isAnnual ? 'year' : 'month'}
                        className={compare.planNote}
                      />
                    ) : (
                      <p className={compare.planNote}>
                        {t(
                          plan.name === 'Free'
                            ? 'No card needed'
                            : 'One-time payment. Never renews.'
                        )}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {PLAN_DIFFS.map((row) => (
              <div
                key={row.feature}
                role="row"
                className={clsx(
                  compare.row,
                  // A row of dashes says nothing once only one group shows.
                  row.cells.every(
                    (cell, i) =>
                      cell.kind === 'none' || PLAN_COLUMNS[i].group !== group
                  ) && compare.rowQuiet
                )}
              >
                <div className={compare.rowLabel} role="rowheader">
                  <span>{t(row.feature)}</span>
                  {row.hint && <span>{t(row.hint)}</span>}
                </div>
                {row.cells.map((cell, i) => (
                  <div
                    key={PLAN_COLUMNS[i].name}
                    role="cell"
                    className={clsx(
                      compare.cell,
                      PLAN_COLUMNS[i].group !== group && compare.off
                    )}
                  >
                    <DiffValue cell={cell} />
                  </div>
                ))}
              </div>
            ))}
          </div>

          <p className={compare.foot}>
            {t(
              isAnnual
                ? 'Cloud plans renew automatically. Cancel anytime in Manage billing; the plan runs to the end of the paid year.'
                : 'Cloud plans renew automatically. Cancel anytime in Manage billing; the plan runs to the end of the paid month.'
            )}
          </p>
          {/* The phone table is for reading; buying and its terms stay on the cards. */}
          <a className={compare.back} href="#pricing">
            {t('Choose a plan')} <span aria-hidden="true">↑</span>
          </a>
        </div>
      </section>

      <section className={compare.block} aria-labelledby="compare-features">
        <div className={compare.heading}>
          <div>
            <h3 id="compare-features">{t('What you get with Enconvo')}</h3>
            <p>
              {t(
                'All of this comes with every plan, Free included, unless it carries a mark.'
              )}
            </p>
          </div>
          <ul className={compare.legend}>
            <li>
              <span className={compare.dot} />
              {t('Free has a limit')}
            </li>
            <li>
              <span className={clsx(compare.dot, compare.dotPaid)} />
              {t('Paid plans only')}
            </li>
          </ul>
        </div>
        <div className={compare.bento}>
          {FEATURE_GROUPS.map((features) => (
            <div
              key={features.title}
              className={clsx(
                compare.featureCard,
                features.span === 12 && compare.featureCardFull
              )}
              style={{ gridColumn: `span ${features.span}` }}
            >
              <div className={compare.featureHead}>
                <span className={compare.featureIcon}>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={features.icon} />
                  </svg>
                </span>
                <div>
                  <h4>{t(features.title)}</h4>
                  <p>{t(features.subtitle)}</p>
                </div>
              </div>
              <ul
                className={compare.featureItems}
                style={{ '--columns': features.columns } as CSSProperties}
              >
                {features.items.map((item) => (
                  <li key={item.name} className={compare.featureItem}>
                    <span>{t(item.name)}</span>
                    <AccessTag access={item.access} />
                    <p>{t(item.description)}</p>
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

// ---- The cards: Free, the Lifetime License and the Cloud Plan. Each product's
// tiers fold into its own card, and the plan table below shows them side by side.

// Hosting conferences and using other computers ship in 2.5.12, still in beta. The site
// describes what the released app does, so turn this on when 2.5.12 is released.
const SHOW_2_5_12_FEATURES = false

// Teams lifetime license (ADR 0112): the buyer becomes the Team admin and
// assigns each Seat to one person's own account, with one Mac per Seat.
// The base price covers five seats; each one after that is the seat price
// (lifetime-pricing.ts).
const TEAMS_MIN_SEATS = TEAMS_BASE_SEATS
const TEAMS_MAX_SEATS = 500

type LicenseTier = 'Standard' | 'Premium' | 'Teams'
type CloudTierName = 'Plus' | 'Pro' | 'Max'

const LICENSE_TABS: { id: LicenseTier }[] = [
  { id: 'Standard' },
  { id: 'Premium' },
  { id: 'Teams' },
]
const LICENSE_CTA: Record<LicenseTier, string> = {
  Standard: 'Buy Standard',
  Premium: 'Buy Premium',
  Teams: 'Buy Teams License',
}

type CardRow = {
  /** The row's message. `{p0}` in it is `strong`, set in bold. */
  text: string
  strong?: string
  desc?: string
  descValues?: Record<string, string>
  /** An "everything in…" row, marked with a plus instead of a check. */
  plus?: boolean
  rates?: boolean
}

const FREE_ROWS: CardRow[] = [
  {
    text: 'Unlimited AI with your own API key',
    desc: '20+ providers, plus local models.',
  },
  {
    text: 'Agents, Computer Use & Browser Use',
    desc: '100+ tools, MCP servers and skills.',
  },
  { text: 'SmartBar, PopBar & Dynamic Island' },
  {
    text: 'Dictation, voice commands & read aloud',
    desc: 'Offline, or on Cloud points.',
  },
  { text: 'iPhone & Android app' },
]

// What the app enforces on Free (LICENSE_DEVICES, the speech and Live Talk gates,
// each module's plan gate, the one-time welcome points, one paired computer); any paid
// plan lifts all of it, and pairs up to 10 devices per computer. The long labels sit in
// the grid's wider middle column, so a new limit goes last.
const FREE_LIMITS: { label: string; value: string }[] = [
  { label: 'Mac device', value: '1' },
  { label: 'Meetings / mo', value: '60 min' },
  { label: 'Captions / mo', value: '60 min' },
  { label: 'Live Talk / mo', value: '5 min' },
  { label: 'Knowledge base', value: '1' },
  { label: 'Workflow', value: '1' },
  { label: 'Scheduled task', value: '1 active' },
  { label: 'IM bot', value: '1 running' },
  { label: 'Points, once', value: '5,000' },
  ...(SHOW_2_5_12_FEATURES ? [{ label: 'Other computer', value: '1' }] : []),
]

const PAID_ONLY: string[] = [
  'Sync',
  ...(SHOW_2_5_12_FEATURES ? ['Host conferences'] : []),
]

function licenseRows(
  tier: LicenseTier,
  seats: number,
  seatPrice: string
): CardRow[] {
  const isTeams = tier === 'Teams'
  const lifetime = tier !== 'Standard'
  return [
    { text: 'Everything in Free, without the caps', plus: true },
    { text: 'Unlimited meetings, captions & Live Talk' },
    { text: 'Unlimited knowledge bases, workflows, scheduled tasks & IM bots' },
    { text: 'Cloud dictation, no points' },
    ...(SHOW_2_5_12_FEATURES
      ? [
          { text: 'Host conferences', desc: 'Guests join from a link.' },
          {
            text: 'Your other computers',
            desc: 'Their chats, terminal and screen, from here. Up to {p0} paired devices per computer, phones included.',
            descValues: { p0: '10' },
          },
        ]
      : []),
    { text: '{p0} Sync across Macs', strong: lifetime ? '100 MB' : '50 MB' },
    isTeams
      ? {
          text: '{p0} Cloud points to share',
          strong: (seats * 50000).toLocaleString('en-US'),
          desc: '{p0} per seat.',
          descValues: { p0: '50,000' },
        }
      : {
          text: '{p0} Cloud points bonus',
          strong: tier === 'Premium' ? '150,000' : '50,000',
        },
    { text: '{p0} free updates', strong: lifetime ? 'Lifelong' : '1 year' },
    isTeams
      ? {
          text: '{p0} Mac per seat',
          strong: '1',
          desc: 'Each person signs in with their own account. More seats any time at {p0} each.',
          descValues: { p0: seatPrice },
        }
      : tier === 'Premium'
      ? { text: '{p0} Mac devices', strong: '3' }
      : { text: '{p0} Mac device', strong: '1' },
  ]
}

function cloudRows(tier: CloudTier): CardRow[] {
  return [
    {
      text: 'Everything a license unlocks',
      desc: 'Every cap off, Sync and more, while you subscribe.',
      plus: true,
    },
    { text: '{p0} points / month', strong: tier.points, rates: true },
    {
      text: 'Every Cloud model & service',
      desc: 'Chat, image, TTS and transcription.',
    },
    { text: 'Latest frontier models', desc: 'GPT, Claude, Gemini & more.' },
    { text: 'No API keys needed' },
    tier.discount
      ? {
          text: '{p0} on select models',
          strong: tier.discount.price,
          desc: 'DeepSeek, MiniMax M3/M3.1 Flash & GLM-5.3-Flash, up to {p0} points of usage.',
          descValues: { p0: tier.discount.cap },
        }
      : {
          text: 'Standard model rates',
          desc: 'Pro and Max pay 1/2 and 1/4 on DeepSeek, MiniMax M3/M3.1 Flash & GLM-5.3-Flash.',
        },
    { text: '5 Mac devices' },
    { text: 'Updates + priority support' },
  ]
}

function PlusIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      className={className}
    >
      <circle cx={12} cy={12} r={8.25} />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  )
}

// Who supplies the AI: the two Pricing dimension groups, on top of each card.
function CardKind({ cloud = false }: { cloud?: boolean }) {
  const { t } = useI18n()
  return (
    <p className={cards.kind}>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {cloud ? (
          <path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 11a3.8 3.8 0 0 1-.7 7.5z" />
        ) : (
          <>
            <circle cx={8} cy={15} r={4} />
            <path d="m11 12 8.5-8.5M16 7l3 3M13.5 9.5l2 2" />
          </>
        )}
      </svg>
      {t(cloud ? 'We bring the AI' : 'You bring the AI')}
    </p>
  )
}

function TierSwitch<Tier extends string>({
  label,
  tabs,
  value,
  onChange,
}: {
  label: string
  tabs: { id: Tier; tag?: string }[]
  value: Tier
  onChange: (tier: Tier) => void
}) {
  const { t } = useI18n()
  const index = tabs.findIndex((tab) => tab.id === value)
  return (
    <div className={cards.seg} role="group" aria-label={t(label)}>
      <span
        className={cards.thumb}
        style={{
          width: `calc((100% - ${8 + (tabs.length - 1) * 2}px) / ${tabs.length})`,
          transform: `translateX(calc(${index} * (100% + 2px)))`,
        }}
      />
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-pressed={tab.id === value}
          onClick={() => onChange(tab.id)}
        >
          {t(tab.id)}
          {tab.tag && <i>{t(tab.tag)}</i>}
        </button>
      ))}
    </div>
  )
}

function CardButton({
  lookupKey,
  extra,
  children,
}: {
  lookupKey: string
  extra?: Record<string, unknown>
  children: ReactNode
}) {
  const { t, locale } = useI18n()
  const [isLoading, setIsLoading] = useState(false)
  return (
    <button
      type="button"
      className={cards.cta}
      disabled={isLoading}
      onClick={() => startCheckout(lookupKey, setIsLoading, locale, extra)}
    >
      {isLoading ? (
        <>
          <span className={cards.spinner} />
          {t('Going to checkout...')}
        </>
      ) : (
        children
      )}
    </button>
  )
}

function CardRows({ rows }: { rows: CardRow[] }) {
  const { t } = useI18n()
  return (
    <ul className={cards.list}>
      {rows.map((row) => (
        <li key={row.text}>
          {row.plus ? (
            <PlusIcon className={clsx(cards.ico, cards.icoPlus)} />
          ) : (
            <CheckIcon className={cards.ico} />
          )}
          <span className={clsx(cards.line, row.plus && cards.lineMuted)}>
            {row.strong ? (
              <I18nText
                source={row.text}
                values={{ p0: <strong>{t(row.strong)}</strong> }}
              />
            ) : (
              t(row.text)
            )}
            {row.desc && (
              <span className={cards.desc}>
                {t(row.desc, row.descValues)}
              </span>
            )}
            {row.rates && (
              <Link href="/cloud-pricing" className={cards.rates}>
                {t('See model & service rates ')}
                <span aria-hidden="true">↗</span>
              </Link>
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}

function SeatStepper({
  seats,
  onChange,
}: {
  seats: number
  onChange: (seats: number) => void
}) {
  const { t } = useI18n()
  // What's being typed: 12 passes through 1 on the way, so it's clamped when the field is left.
  const [draft, setDraft] = useState<string | null>(null)
  const clamp = (n: number) =>
    Math.min(
      TEAMS_MAX_SEATS,
      Math.max(TEAMS_MIN_SEATS, Math.floor(n) || TEAMS_MIN_SEATS)
    )

  return (
    <div className={cards.stepper}>
      <button
        type="button"
        aria-label={t('Fewer seats')}
        onClick={() => onChange(clamp(seats - 1))}
        disabled={seats <= TEAMS_MIN_SEATS}
      >
        −
      </button>
      <input
        type="number"
        min={TEAMS_MIN_SEATS}
        max={TEAMS_MAX_SEATS}
        aria-label={t('Seats')}
        value={draft ?? seats}
        onChange={(event) => {
          const value = event.target.value
          setDraft(value)
          if (Number(value) === clamp(Number(value))) onChange(Number(value))
        }}
        onBlur={() => {
          if (draft !== null) onChange(clamp(Number(draft)))
          setDraft(null)
        }}
      />
      <button
        type="button"
        aria-label={t('More seats')}
        onClick={() => onChange(clamp(seats + 1))}
        disabled={seats >= TEAMS_MAX_SEATS}
      >
        +
      </button>
    </div>
  )
}

function FreeCard() {
  const { t } = useI18n()
  return (
    <article
      className={clsx(cards.card, cards.left)}
      aria-label={t('Free')}
      data-spotlight
    >
      <CardKind />
      <div className={cards.title}>
        <h3>{t('Free')}</h3>
      </div>
      <p className={cards.tagline}>{t('Most of Enconvo, on your own keys.')}</p>
      <div className={cards.segSlot} />
      <div className={cards.price}>
        <span className={cards.amount}>$0</span>
        <span className={cards.unit}>{t('forever')}</span>
      </div>
      <div className={cards.sub}>
        <span>{t('No card needed')}</span>
      </div>
      <CardButton lookupKey="free">
        <AppleIcon />
        {t('Download for Mac')}
      </CardButton>
      <p className={cards.note}>
        {t('Requires macOS 14 or later and a free account.')}
      </p>
      <div className={cards.body}>
        <CardRows rows={FREE_ROWS} />
        <div className={cards.block}>
          <p>{t('Free limits')}</p>
          <dl className={cards.spec}>
            {FREE_LIMITS.map((limit) => (
              <div key={limit.label}>
                <dt>{t(limit.label)}</dt>
                <dd>{t(limit.value)}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className={cards.block}>
          <p>{t('Paid plans only')}</p>
          <ul className={cards.chips}>
            {PAID_ONLY.map((feature) => (
              <li key={feature}>{t(feature)}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}

function LicenseCard({
  tier,
  onTier,
  now,
  saleBadge,
}: {
  tier: LicenseTier
  onTier: (tier: LicenseTier) => void
  now: number
  saleBadge?: string
}) {
  const { t } = useI18n()
  const [seats, setSeats] = useState(TEAMS_MIN_SEATS)
  const prices = lifetimePrices(now)
  const isTeams = tier === 'Teams'
  const listCents = isTeams
    ? teamsCents(seats, now)
    : tier === 'Premium'
    ? prices.premium.cents
    : prices.standard.cents
  const payCents = saleCents(listCents, now)
  const price = usd(payCents)
  // A struck price shares the line with the figure, so a long one steps down rather than wraps.
  const amountSize = !saleBadge
    ? undefined
    : price.length >= 8
    ? cards.amountXs
    : cards.amountSm

  return (
    <article
      id="pricing-teams"
      style={{ scrollMarginTop: 96 }}
      className={clsx(cards.card, cards.raised)}
      aria-label={t('Lifetime License')}
      data-spotlight
    >
      <CardKind />
      <div className={cards.title}>
        <h3>{t('Lifetime License')}</h3>
        {saleBadge && <span className={cards.badge}>{saleBadge}</span>}
      </div>
      <p className={cards.tagline}>{t('Pay once. Yours for life.')}</p>
      <div className={cards.segSlot}>
        <TierSwitch
          label="License tier"
          tabs={LICENSE_TABS}
          value={tier}
          onChange={onTier}
        />
      </div>
      <div className={cards.price} aria-live="polite" aria-atomic="true">
        {saleBadge && (
          <s className={cards.was}>
            <span className="sr-only">{t('Original price ')}</span>
            {usd(listCents)}
          </s>
        )}
        <span className={clsx(cards.amount, amountSize)}>{price}</span>
        <span className={cards.unit}>{t('one-time')}</span>
      </div>
      <div className={cards.sub}>
        {isTeams ? (
          <>
            <span>
              {t('{p0} seats · {p1} / seat', {
                p0: seats,
                p1: `$${(payCents / seats / 100).toFixed(2)}`,
              })}
            </span>
            <SeatStepper seats={seats} onChange={setSeats} />
          </>
        ) : (
          <span>{t('30-day money back guarantee.')}</span>
        )}
      </div>
      <CardButton
        lookupKey={tier.toLowerCase()}
        extra={isTeams ? { seats } : undefined}
      >
        {t(LICENSE_CTA[tier])}
        <ArrowIcon />
      </CardButton>
      <p className={cards.note}>
        {t('One-time payment. Never renews.')}
        {isTeams && ` ${t('30-day money back guarantee.')}`}
      </p>
      <div className={cards.body}>
        <CardRows
          rows={licenseRows(tier, seats, usd(prices.teams_seat.cents))}
        />
        <p className={cards.foot}>
          {t('Want AI included? Add any Cloud plan on top.')}
        </p>
      </div>
    </article>
  )
}

interface CloudTier {
  name: CloudTierName
  points: string
  monthly: { price: string; lookupKey: string }
  annual: { price: string; was: string; perMonth: string; lookupKey: string }
  /** The lower rate on select models, and how many points of usage get it. */
  discount?: { price: string; cap: string }
}

// Tier data mirrors the in-app plan picker (PlansDialog / worker cloudTiers).
const CLOUD_TIERS: CloudTier[] = [
  {
    name: 'Plus',
    points: '500,000',
    monthly: { price: '$10', lookupKey: 'monthly' },
    annual: { price: '$96', was: '$120', perMonth: '$8', lookupKey: 'yearly' },
  },
  {
    name: 'Pro',
    points: '2,500,000',
    monthly: { price: '$50', lookupKey: 'pro_monthly' },
    annual: {
      price: '$480',
      was: '$600',
      perMonth: '$40',
      lookupKey: 'pro_yearly',
    },
    discount: { price: '1/2 price', cap: '5M' },
  },
  {
    name: 'Max',
    points: '5,000,000',
    monthly: { price: '$100', lookupKey: 'max_monthly' },
    annual: {
      price: '$960',
      was: '$1,200',
      perMonth: '$80',
      lookupKey: 'max_yearly',
    },
    discount: { price: '1/4 price', cap: '20M' },
  },
]

const CLOUD_TABS: { id: CloudTierName; tag?: string }[] = [
  { id: 'Plus' },
  { id: 'Pro', tag: 'Popular' },
  { id: 'Max' },
]

function CloudCard({
  billing,
  onBilling,
}: {
  billing: 'monthly' | 'annual'
  onBilling: (billing: 'monthly' | 'annual') => void
}) {
  const { t } = useI18n()
  const [name, setName] = useState<CloudTierName>('Plus')
  const tier = CLOUD_TIERS.find((item) => item.name === name) ?? CLOUD_TIERS[0]
  const isAnnual = billing === 'annual'

  return (
    <article
      className={clsx(cards.card, cards.right)}
      aria-label={t('Cloud Plan')}
      data-spotlight
    >
      <CardKind cloud />
      <div className={cards.title}>
        <h3>{t('Cloud Plan')}</h3>
      </div>
      <p className={cards.tagline}>
        {t('No API keys. Points power every model.')}
      </p>
      <div className={cards.segSlot}>
        <TierSwitch<CloudTierName>
          label="Cloud plan tier"
          tabs={CLOUD_TABS}
          value={name}
          onChange={setName}
        />
      </div>
      <div className={cards.price} aria-live="polite" aria-atomic="true">
        <span className={cards.amount}>
          {isAnnual ? tier.annual.perMonth : tier.monthly.price}
        </span>
        <span className={cards.unit}>{t('/month')}</span>
      </div>
      <div className={cards.sub}>
        <span>
          {isAnnual ? (
            <>
              <s>
                <span className="sr-only">{t('Original price ')}</span>
                {tier.annual.was}
              </s>{' '}
              {t('billed {p0}/year', { p0: tier.annual.price })}
            </>
          ) : (
            t('Billed monthly')
          )}
        </span>
        <BillingSwitch billing={billing} onBilling={onBilling} />
      </div>
      <CardButton
        lookupKey={isAnnual ? tier.annual.lookupKey : tier.monthly.lookupKey}
      >
        {t('Subscribe to {p0}', { p0: t(tier.name) })}
        <ArrowIcon />
      </CardButton>
      <RenewalTerms
        amount={isAnnual ? tier.annual.price : tier.monthly.price}
        period={isAnnual ? 'year' : 'month'}
        className={cards.note}
      />
      <div className={cards.body}>
        <CardRows rows={cloudRows(tier)} />
        <p className={cards.foot}>
          {t('Your own keys stay free and unlimited here too.')}
        </p>
      </div>
    </article>
  )
}

/**
 * `renderedAt` is when the static page was generated. License prices follow their schedule
 * (lifetime-pricing.ts) from that instant, then from the visitor's clock once the page loads.
 */
export function Pricing({ renderedAt }: { renderedAt: number }) {
  const { t } = useI18n()

  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual')
  const [licenseTier, setLicenseTier] = useState<LicenseTier>('Standard')
  const [now, setNow] = useState(renderedAt)
  useEffect(() => {
    setNow(Date.now())
    if (window.location.hash === '#pricing-teams') setLicenseTier('Teams')
  }, [])
  const sale = lifetimeSale(now)
  const saleBadge = sale ? t(sale.badge, { p0: sale.percentOff }) : undefined

  return (
    <section
      id="pricing"
      aria-label={t('Pricing')}
      className={clsx(styles.section, styles.pricingSection, cards.section)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={cards.aurora}
        src={auroraBloom.src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      <div className={`${styles.sectionContainer} mx-auto`}>
        <div className={cards.heading} data-reveal>
          <p className={cards.eyebrow}>{t('Pricing')}</p>
          <h2>{t('Simple pricing, for everyone.')}</h2>
          <p>
            {t(
              'Start free. Pay once and bring your own AI, or let Enconvo Cloud bring it. The two stack.'
            )}
          </p>
        </div>

        <AffiliateOffer />

        <div className={cards.row} data-reveal>
          <FreeCard />
          <LicenseCard
            tier={licenseTier}
            onTier={setLicenseTier}
            now={now}
            saleBadge={saleBadge}
          />
          <CloudCard billing={billing} onBilling={setBilling} />
        </div>

        <div className={cards.after}>
          <a className={cards.compare} href="#compare">
            {t('Compare all plans')}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14m0 0-5-5m5 5 5-5" />
            </svg>
          </a>
          <p>
            {t(
              'Licenses and Cloud plans stack — a Lifetime owner can add any Cloud plan for included points, and every plan keeps own-key usage unlimited.'
            )}{' '}
            <I18nText
              source={'Need more than 500 seats or private deployment? {p0}.'}
              values={{
                p0: (
                  <a href="mailto:support@enconvo.com">{t('Contact us')}</a>
                ),
              }}
            />
          </p>
        </div>

        <PlanComparison
          billing={billing}
          onBilling={setBilling}
          now={now}
          onChooseTeams={() => setLicenseTier('Teams')}
        />
      </div>
    </section>
  )
}
