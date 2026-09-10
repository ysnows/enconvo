import styles from '@/styles/Home.module.css'
import clsx from 'clsx'
import Link from 'next/link'
import { Fragment, useState } from 'react'
import { Button } from '@/components/Button'
import { supabase } from '@/lib/supabase'

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
  extra?: Record<string, unknown>
) {
  try {
    setIsLoading(true)
    if (lookupKey === 'free') {
      window.location.href = 'https://api.enconvo.com/app/download'
      return
    }

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      const returnUrl = `/pricing?plan=${lookupKey}`
      window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`
      return
    }

    const response = await fetch('/api/subscription/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lookupKey,
        email: session.user.email,
        endorsely_referral: window.endorsely_referral,
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
  return (
    <ul className={styles.planFeatures}>
      {features.map(feature => (
        <li key={feature}>
          <CheckIcon className={styles.planCheck} />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  )
}

function Plan({
  name, price, priceNote, billingNote, allowance, lookupKey, badge, description,
  startText = 'Get started', detailsHref, features, featured = false,
}: PlanProps) {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <section aria-label={`${name} plan`} data-spotlight className={clsx(styles.planCard, featured && styles.planFeatured)}>
      <div className={styles.planIdentity}>
        <div className={styles.planTitleRow}>
          <h4>{name}</h4>
          {badge && <span className={styles.planBadge}>{badge}</span>}
        </div>
        <p>{description}</p>
      </div>
      <div className={styles.planPriceBlock}>
        <div className={styles.planPriceRow}>
          <span className={styles.planAmount}>{price}</span>
          {priceNote && <span className={styles.planUnit}>{priceNote}</span>}
        </div>
        <p className={styles.planBillingNote}>{billingNote || '\u00a0'}</p>
      </div>
      <div className={styles.planAction}>
        <Button
          onClick={() => startCheckout(lookupKey, setIsLoading)}
          variant={featured ? 'solid' : 'outline'} color="white"
          className={styles.planPurchase} disabled={isLoading}
          aria-label={isLoading ? 'Going to checkout...' : `${startText} — ${name}`}
        >
          {isLoading ? (
            <><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />Going to checkout...</>
          ) : (
            <>{startText}<svg className="ml-2 h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>
          )}
        </Button>
        {detailsHref && <a href={detailsHref} className={styles.planDetailsLink}>See model &amp; service rates</a>}
      </div>
      {allowance && <p className={styles.planAllowance}><strong>{allowance.split(' points')[0]}</strong><span>points / month</span></p>}
      <PlanFeatures features={features} />
    </section>
  )
}

// ---- Full benefits comparison (shown under each plan group) ----
// `true` renders a check, `false` a muted dash, a string renders as text.
// Mirrors the in-app plan picker (PlansDialog).
type ComparisonCell = boolean | string
type ComparisonRow = { feature: string; values: ComparisonCell[] }
type ComparisonGroup = { title?: string; rows: ComparisonRow[] }
type ComparisonData = { columns: string[]; groups: ComparisonGroup[] }

const LICENSE_COMPARISON: ComparisonData = {
  columns: ['Free', 'Standard', 'Premium', 'Teams'],
  groups: [
    {
      title: 'AI & Chat',
      rows: [
        { feature: 'Unlimited AI with your own API key', values: [true, true, true, true] },
        { feature: '20+ model providers — OpenAI, Claude, Gemini, DeepSeek & more', values: [true, true, true, true] },
        { feature: 'Local models — Ollama, LM Studio, MLX', values: [true, true, true, true] },
        { feature: 'Agent mode with tools, planning & skills', values: [true, true, true, true] },
        { feature: 'Cloud points bonus', values: ['5,000 welcome', '50,000', '150,000', '50,000 / seat'] },
      ],
    },
    {
      title: 'Surfaces & Tools',
      rows: [
        { feature: 'SmartBar, App Sidebar, PopBar & Dynamic Island', values: [true, true, true, true] },
        { feature: '100+ built-in tools and plugins', values: [true, true, true, true] },
        { feature: 'MCP servers & custom skills', values: [true, true, true, true] },
        { feature: 'Computer use & browser automation', values: [true, true, true, true] },
        { feature: 'Screenshot, OCR & screen doodle', values: [true, true, true, true] },
      ],
    },
    {
      title: 'Voice & Meetings',
      rows: [
        { feature: 'Dictation & voice commands', values: [true, true, true, true] },
        { feature: 'Read aloud (text-to-speech)', values: [true, true, true, true] },
        { feature: 'Meeting recording', values: ['1 free session', 'Unlimited', 'Unlimited', 'Unlimited'] },
        { feature: 'Live captions', values: ['1 free session', 'Unlimited', 'Unlimited', 'Unlimited'] },
      ],
    },
    {
      title: 'Knowledge & Automation',
      rows: [
        { feature: 'Knowledge bases', values: ['1', 'Unlimited', 'Unlimited', 'Unlimited'] },
        { feature: 'Workflows', values: ['1', 'Unlimited', 'Unlimited', 'Unlimited'] },
        { feature: 'Memory & context awareness', values: [true, true, true, true] },
        { feature: 'Scheduled jobs & IM bots — Telegram, Discord, Slack, Lark', values: [true, true, true, true] },
        { feature: 'Import & export (Portability)', values: [false, true, true, true] },
      ],
    },
    {
      title: 'License',
      rows: [
        { feature: 'Free updates', values: [false, '1 year', 'Lifetime', 'Lifetime'] },
        { feature: 'Mac devices', values: ['1', '1', '3', '5 – 500'] },
        { feature: '30-day money-back guarantee', values: [false, true, true, true] },
      ],
    },
  ],
}

// Columns: Free · Plus · Pro · Max. Tier data mirrors the worker's cloudTiers.ts.
// A Cloud subscription is a paid tier everywhere the app gates on membership, so it
// unlocks the SAME unlimited features as a lifetime license (KBs, workflows,
// recording, captions) on top of the monthly points.
const CLOUD_COMPARISON: ComparisonData = {
  columns: ['Free', 'Plus', 'Pro', 'Max'],
  groups: [
    {
      title: 'Points',
      rows: [
        { feature: 'Included points', values: ['5,000 welcome', '500K / month', '2.5M / month', '5M / month'] },
        { feature: 'DeepSeek, MiniMax M3 & GLM-5.3-Flash rates', values: ['Standard', 'Standard', '1/2 price', '1/4 price'] },
        { feature: 'Points top-up packs', values: [true, true, true, true] },
        { feature: 'Annual billing — save 20%', values: [false, '$96 / year', '$480 / year', '$960 / year'] },
      ],
    },
    {
      title: 'Cloud Services',
      rows: [
        { feature: 'Works without API keys', values: [false, true, true, true] },
        { feature: 'Every Cloud model & service — chat, image, TTS, transcription', values: [false, true, true, true] },
        { feature: 'Latest frontier models — GPT, Claude, Gemini & more', values: [false, true, true, true] },
        { feature: 'Priority support', values: [false, true, true, true] },
      ],
    },
    {
      title: 'AI & Chat',
      rows: [
        { feature: 'Unlimited AI with your own API key', values: [true, true, true, true] },
        { feature: '20+ model providers — OpenAI, Claude, Gemini, DeepSeek & more', values: [true, true, true, true] },
        { feature: 'Local models — Ollama, LM Studio, MLX', values: [true, true, true, true] },
        { feature: 'Agent mode with tools, planning & skills', values: [true, true, true, true] },
      ],
    },
    {
      title: 'Surfaces & Tools',
      rows: [
        { feature: 'SmartBar, App Sidebar, PopBar & Dynamic Island', values: [true, true, true, true] },
        { feature: '100+ built-in tools and plugins', values: [true, true, true, true] },
        { feature: 'MCP servers & custom skills', values: [true, true, true, true] },
        { feature: 'Computer use & browser automation', values: [true, true, true, true] },
        { feature: 'Screenshot, OCR & screen doodle', values: [true, true, true, true] },
      ],
    },
    {
      title: 'Voice & Meetings',
      rows: [
        { feature: 'Dictation & voice commands', values: [true, true, true, true] },
        { feature: 'Read aloud (text-to-speech)', values: [true, true, true, true] },
        { feature: 'Meeting recording', values: ['1 free session', 'Unlimited', 'Unlimited', 'Unlimited'] },
        { feature: 'Live captions', values: ['1 free session', 'Unlimited', 'Unlimited', 'Unlimited'] },
      ],
    },
    {
      title: 'Knowledge & Automation',
      rows: [
        { feature: 'Knowledge bases', values: ['1', 'Unlimited', 'Unlimited', 'Unlimited'] },
        { feature: 'Workflows', values: ['1', 'Unlimited', 'Unlimited', 'Unlimited'] },
        { feature: 'Memory & context awareness', values: [true, true, true, true] },
        { feature: 'Scheduled jobs & IM bots — Telegram, Discord, Slack, Lark', values: [true, true, true, true] },
        { feature: 'Import & export (Portability)', values: [false, true, true, true] },
      ],
    },
    {
      title: 'Account',
      rows: [
        { feature: 'Mac devices', values: ['1', '5', '5', '5'] },
      ],
    },
  ],
}

function ComparisonTable({ data, label }: { data: ComparisonData; label: string }) {
  return (
    <details className={styles.comparisonDisclosure}>
      <summary>
        <span>{label}</span>
        <span className={styles.comparisonSummaryNote}>{data.columns.join(' · ')}</span>
        <svg className={styles.comparisonChevron} aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="m5 7.5 5 5 5-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </summary>
      <div className={styles.comparison}>
      <div className={styles.comparisonScroll} tabIndex={0} role="region" aria-label={`Compare ${data.columns.join(", ")} plans`}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline">
              <th scope="col" className="w-[36%] py-3.5 pl-6 pr-3 text-xs font-medium text-content-muted">
                Everything you get
              </th>
              {data.columns.map((c) => (
                <th key={c} scope="col" data-recommended={c === 'Pro'} className="px-3 py-3.5 text-center text-sm font-semibold text-content">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.groups.map((group, gi) => (
              <Fragment key={group.title ?? gi}>
                {group.title && (
                  <tr>
                    <td
                      colSpan={data.columns.length + 1}
                      className="pb-1.5 pl-6 pt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-content-ash"
                    >
                      {group.title}
                    </td>
                  </tr>
                )}
                {group.rows.map((row, ri) => (
                  <tr
                    key={row.feature}
                    className={clsx(
                      'border-b transition-colors hover:bg-surface-elevated/40',
                      ri === group.rows.length - 1 && gi !== data.groups.length - 1
                        ? 'border-hairline'
                        : 'border-hairline/50',
                      gi === data.groups.length - 1 && ri === group.rows.length - 1 && 'border-0',
                    )}
                  >
                    <th scope="row" className="py-3 pl-6 pr-3 font-normal leading-snug text-content-body">{row.feature}</th>
                    {row.values.map((v, i) => (
                      <td key={i} data-recommended={data.columns[i] === 'Pro'} className="px-3 py-3 text-center">
                        {v === true ? (
                          <span className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-surface-elevated">
                            <CheckIcon className="h-3 w-3 text-signal-blue" /><span className="sr-only">Included</span>
                          </span>
                        ) : v === false ? (
                          <span className="text-xs text-content-ash"><span aria-hidden="true">—</span><span className="sr-only">Not included</span></span>
                        ) : (
                          <span className="text-xs font-medium tabular-nums text-content-body">{v}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </details>
  )
}

// Teams lifetime license (ADR 0036): one account, seat-counted devices.
// Price anchors to the single-user Premium: $99 + (seats − 3) × $20.
const TEAMS_MIN_SEATS = 5
const TEAMS_MAX_SEATS = 500
const teamsPrice = (seats: number) => 99 + (seats - 3) * 20

function TeamsPlan() {
  const [seats, setSeats] = useState(TEAMS_MIN_SEATS)
  const [isLoading, setIsLoading] = useState(false)

  const clamp = (n: number) =>
    Math.min(TEAMS_MAX_SEATS, Math.max(TEAMS_MIN_SEATS, Math.floor(n) || TEAMS_MIN_SEATS))

  return (
    <section aria-label="Teams plan" data-spotlight className={`${styles.planCard} ${styles.teamsPlan}`}>
      <div className={styles.teamsTop}>
        <div className={styles.planIdentity}>
          <h4>Teams</h4>
          <p>One account for your whole team. 30-day money back guarantee.</p>
        </div>
        <div className={styles.teamsControls}>
          <div className={styles.teamsSeats}>
            <label htmlFor="pricing-team-seats">Seats</label>
            <div className={styles.seatStepper}>
              <button type="button" aria-label="Fewer seats" onClick={() => setSeats(s => clamp(s - 1))} disabled={seats <= TEAMS_MIN_SEATS}>−</button>
              <input id="pricing-team-seats" type="number" min={TEAMS_MIN_SEATS} max={TEAMS_MAX_SEATS}
                value={seats} onChange={e => setSeats(clamp(Number(e.target.value)))} />
              <button type="button" aria-label="More seats" onClick={() => setSeats(s => clamp(s + 1))} disabled={seats >= TEAMS_MAX_SEATS}>+</button>
            </div>
          </div>
          <div className={styles.teamsQuote} aria-live="polite" aria-atomic="true">
            <span className={styles.planAmount}>${teamsPrice(seats).toLocaleString()}</span>
            <p className={styles.planBillingNote}>one-time · ${(teamsPrice(seats) / seats).toFixed(2)}/seat</p>
          </div>
          <Button onClick={() => startCheckout('teams', setIsLoading, { seats })}
            variant="outline" color="white" className={styles.planPurchase} disabled={isLoading}>
            {isLoading ? <><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />Going to checkout...</> : 'Buy Teams License'}
          </Button>
        </div>
      </div>
      <PlanFeatures features={[
        `${seats} Mac devices on one account`,
        `${(seats * 50000).toLocaleString()} Cloud points bonus — 50,000 per seat`,
        'Add more seats any time at $20 each',
        'Lifetime free updates',
      ]} />
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
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  return (
    <section
      id="pricing"
      aria-label="Pricing"
      className={`${styles.section} ${styles.pricingSection}`}
    >
      <div className={`${styles.sectionContainer} mx-auto`}>
        <div className={styles.pricingHeading} data-reveal>
          <p className={styles.pricingEyebrow}>Pricing</p>
          <h2 className="font-display text-3xl tracking-tight text-content sm:text-4xl">
            Simple pricing, for everyone.
          </h2>
          <p className="mt-4 text-lg text-content-muted">
            Two ways to pay for AI — and they stack.
          </p>
        </div>

        <div className={styles.pricingGroup}>
          <div className={styles.pricingGroupHeading} data-reveal>
            <span className={styles.pricingKind}>One-time purchase</span>
            <h3 className="font-display text-xl font-semibold text-content">
              You bring the AI
            </h3>
            <p className="mt-2 text-sm text-content-muted">
              Use your own API keys or local models — AI usage is free and
              unlimited on every tier.
            </p>
          </div>

          <div className={styles.licenseGrid} data-reveal>
            <Plan
              name="Standard"
              price="$49"
              priceNote="one-time"
              lookupKey={'standard'}
              description="30-day money back guarantee."
              startText="Buy License"
              features={[
                'Unlimited AI with your own API key',
                'Unlimited knowledge bases & workflows',
                'Import & export (Portability)',
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
              description="30-day money back guarantee."
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
          <ComparisonTable data={LICENSE_COMPARISON} label="Compare all license features" />
        </div>

        <div className={`${styles.pricingGroup} ${styles.cloudGroup}`}>
          <div className={styles.pricingGroupHeading} data-reveal>
            <span className={styles.pricingKind}>Monthly or annual</span>
            <h3 className="font-display text-xl font-semibold text-content">
              Enconvo Cloud Plan
            </h3>
            <p className="mt-2 text-sm text-content-muted">
              No API keys. A monthly point allowance powers every model and
              service.
            </p>

          </div>
          <div className={styles.cloudToolbar}>
            <div className={styles.billingToggle} role="group" aria-label="Cloud billing period">
              <button type="button" onClick={() => setBilling('monthly')} aria-pressed={billing === 'monthly'}>Monthly</button>
              <button type="button" onClick={() => setBilling('annual')} aria-pressed={billing === 'annual'}>Annual<span className={styles.billingSaving}>−20%</span></button>
            </div>
            <Link href="/cloud-pricing" className={styles.pricingRates}>See model &amp; service rates <span aria-hidden="true">↗</span></Link>
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
                  billingNote={isAnnual ? `billed ${tier.annual.price}/year` : undefined}
                  allowance={tier.features[0]}
                  lookupKey={isAnnual ? tier.annual.lookupKey : tier.monthly.lookupKey}
                  badge={tier.badge}
                  featured={tier.featured}
                  description={tier.description}
                  features={tier.features.slice(1)}
                />
              )
            })}
          </div>

          <ComparisonTable data={CLOUD_COMPARISON} label="Compare all Cloud features" />
        </div>

        <div className={styles.pricingFooter}>
          <p className="text-sm text-content-muted">
            Licenses and Cloud plans stack — a Lifetime owner can add any Cloud
            plan for included points, and every plan keeps own-key usage
            unlimited.
          </p>
          <p className="mt-2 text-sm text-content-ash">
            Need more than 500 seats or private deployment?{' '}
            <a
              href="mailto:support@enconvo.com"
              className="text-content-muted underline underline-offset-2 transition hover:text-content"
            >
              Contact us
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
