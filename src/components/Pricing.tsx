import clsx from 'clsx'
import { useState } from 'react'
import { Button } from '@/components/Button'
import { supabase } from '@/lib/supabase'

interface CheckIconProps {
  className: string
}

function CheckIcon({ className }: CheckIconProps) {
  return (
    <svg
      aria-hidden="true"
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
  lookupKey: string
  badge?: string
  description: string
  startText?: string
  detailsHref?: string
  features: string[]
  featured?: boolean
}

function Plan({
  name,
  price,
  priceNote,
  lookupKey,
  badge,
  description,
  startText = 'Get started',
  detailsHref,
  features,
  featured = false,
}: PlanProps) {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <section
      className={clsx(
        'group relative flex flex-col rounded-lg px-6 sm:px-8 py-8 transition-colors bg-surface-card border',
        featured
          ? 'border-hairline-strong'
          : 'border-hairline hover:border-hairline-strong'
      )}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-canvas">
          {badge}
        </span>
      )}

      <div className="order-first">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl font-bold tracking-tight text-content">
            {price}
          </span>
          {priceNote && (
            <span className="text-sm text-content-muted">{priceNote}</span>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-display text-2xl font-bold text-content">{name}</h3>
        <p className="mt-1 text-xs leading-relaxed text-content-muted">
          {description}
        </p>
      </div>

      <div className="mt-8 flex-1">
        <ul role="list" className="space-y-4">
          {features.map((feature) => (
            <li key={feature} className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 bg-surface-elevated">
                <CheckIcon className="w-3 h-3 text-signal-blue" />
              </div>
              <span className="ml-4 text-sm leading-relaxed text-content-body">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <Button
          onClick={() => startCheckout(lookupKey, setIsLoading)}
          variant="outline"
          color="white"
          className={clsx(
            'w-full py-4 text-base font-semibold transition-colors border',
            featured
              ? 'bg-white text-canvas border-white hover:bg-content'
              : 'border-hairline text-content hover:bg-white hover:text-canvas'
          )}
          disabled={isLoading}
        >
          <span className="flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Going to checkout...
              </>
            ) : (
              <>
                {startText}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </span>
        </Button>
        {detailsHref && (
          <a href={detailsHref} className="mt-3 block text-center text-xs text-content-muted transition hover:text-signal-blue">
            See model &amp; service rates
          </a>
        )}
      </div>
    </section>
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
    <section className="group relative flex flex-col gap-8 rounded-lg border border-hairline bg-surface-card px-6 py-8 transition-colors hover:border-hairline-strong sm:px-8 lg:flex-row lg:items-center">
      <div className="lg:max-w-md">
        <h3 className="font-display text-2xl font-bold text-content">Teams</h3>
        <p className="mt-1 text-xs leading-relaxed text-content-muted">
          One account for your whole team — lifetime license, lifetime updates.
          30-day money back guarantee.
        </p>
        <ul role="list" className="mt-6 space-y-3">
          {[
            `${seats} Mac devices on one account`,
            `${(seats * 50000).toLocaleString()} Cloud points bonus — 50,000 per seat`,
            'Add more seats any time at $20 each',
            'Everything in Premium, lifetime free updates',
          ].map((feature) => (
            <li key={feature} className="flex items-start">
              <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-surface-elevated">
                <CheckIcon className="h-3 w-3 text-signal-blue" />
              </div>
              <span className="ml-4 text-sm leading-relaxed text-content-body">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-1 flex-col items-center gap-5 lg:items-end">
        <div className="flex items-center gap-3">
          <span className="text-sm text-content-muted">Seats</span>
          <div className="inline-flex items-center rounded-full border border-hairline bg-surface p-1">
            <button
              type="button"
              aria-label="Fewer seats"
              onClick={() => setSeats((s) => clamp(s - 1))}
              disabled={seats <= TEAMS_MIN_SEATS}
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-content-body transition-colors hover:bg-surface-elevated disabled:opacity-40"
            >
              −
            </button>
            <input
              type="number"
              min={TEAMS_MIN_SEATS}
              max={TEAMS_MAX_SEATS}
              value={seats}
              onChange={(e) => setSeats(clamp(Number(e.target.value)))}
              className="w-14 border-0 bg-transparent text-center text-base font-semibold text-content [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              aria-label="More seats"
              onClick={() => setSeats((s) => clamp(s + 1))}
              disabled={seats >= TEAMS_MAX_SEATS}
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-content-body transition-colors hover:bg-surface-elevated disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl font-bold tracking-tight text-content">
            ${teamsPrice(seats).toLocaleString()}
          </span>
          <span className="text-sm text-content-muted">
            one-time · ${(teamsPrice(seats) / seats).toFixed(2)}/seat
          </span>
        </div>

        <Button
          onClick={() => startCheckout('teams', setIsLoading, { seats })}
          variant="outline"
          color="white"
          className="w-full border border-hairline py-4 text-base font-semibold text-content transition-colors hover:bg-white hover:text-canvas lg:w-64"
          disabled={isLoading}
        >
          <span className="flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Going to checkout...
              </>
            ) : (
              <>
                Buy Teams License
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </span>
        </Button>
      </div>
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
      'No API key needed',
      'Unlimited knowledge bases & workflows',
      'Import & export (Portability)',
      '5 Mac devices',
      'Priority support',
    ],
  },
  {
    name: 'Pro',
    description: 'DeepSeek & MiniMax M3 at half price.',
    badge: 'Most popular',
    featured: true,
    monthly: { price: '$50', lookupKey: 'pro_monthly' },
    annual: { price: '$480', perMonth: '$40', lookupKey: 'pro_yearly' },
    features: [
      '2,500,000 points / month',
      '⚡ DeepSeek & MiniMax M3 at 1/2 price — up to 5M points of usage',
      'Everything in Plus',
    ],
  },
  {
    name: 'Max',
    description: 'DeepSeek & MiniMax M3 at quarter price.',
    monthly: { price: '$100', lookupKey: 'max_monthly' },
    annual: { price: '$960', perMonth: '$80', lookupKey: 'max_yearly' },
    features: [
      '5,000,000 points / month',
      '⚡ DeepSeek & MiniMax M3 at 1/4 price — up to 20M points of usage',
      'Everything in Pro',
    ],
  },
]

export function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  return (
    <section
      id="pricing"
      aria-label="Pricing"
      className="bg-canvas py-20 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="md:text-center">
          <h2 className="font-display text-3xl tracking-tight text-content sm:text-4xl">
            Simple pricing, for everyone.
          </h2>
          <p className="mt-4 text-lg text-content-muted">
            Two ways to pay for AI — and they stack.
          </p>
        </div>

        <div className="mt-16">
          <div className="md:text-center">
            <h3 className="font-display text-xl font-semibold text-content">
              You bring the AI
            </h3>
            <p className="mt-2 text-sm text-content-muted">
              Use your own API keys or local models — AI usage is free and
              unlimited on every tier.
            </p>
          </div>

          <div className="mt-8 grid max-w-7xl mx-auto grid-cols-1 gap-8 lg:grid-cols-3">
            <Plan
              name="Free"
              price="$0"
              lookupKey={'free'}
              description="Everything you need to make Enconvo yours."
              startText={'Download'}
              features={[
                'Unlimited AI with your own API key',
                'All surfaces — SmartBar, App Sidebar, PopBar & more',
                '100+ built-in tools and plugins',
                '5,000 welcome Cloud points',
                '1 knowledge base · 1 workflow',
                '1 Mac device',
              ]}
            />

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

          <div className="mt-8 max-w-7xl mx-auto">
            <TeamsPlan />
          </div>
        </div>

        <div className="mt-20">
          <div className="md:text-center">
            <h3 className="font-display text-xl font-semibold text-content">
              We bring the AI
            </h3>
            <p className="mt-2 text-sm text-content-muted">
              No API keys. A monthly point allowance powers every model and
              service.
            </p>

            <div className="mt-6 inline-flex items-center rounded-full border border-hairline bg-surface p-1">
              <button
                onClick={() => setBilling('monthly')}
                className={clsx(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  billing === 'monthly'
                    ? 'bg-surface-elevated text-content ring-1 ring-hairline-strong'
                    : 'text-content-muted hover:text-content-body'
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('annual')}
                className={clsx(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  billing === 'annual'
                    ? 'bg-surface-elevated text-content ring-1 ring-hairline-strong'
                    : 'text-content-muted hover:text-content-body'
                )}
              >
                Annual
                <span className="ml-1.5 text-xs text-signal-green">-20%</span>
              </button>
            </div>
          </div>

          <div className="mt-8 grid max-w-7xl mx-auto grid-cols-1 gap-8 lg:grid-cols-3">
            {CLOUD_TIERS.map((tier) => {
              const isAnnual = billing === 'annual'
              return (
                <Plan
                  key={tier.name}
                  name={tier.name}
                  price={isAnnual ? tier.annual.perMonth : tier.monthly.price}
                  priceNote={
                    isAnnual
                      ? `/mo · billed ${tier.annual.price}/year`
                      : '/month'
                  }
                  lookupKey={isAnnual ? tier.annual.lookupKey : tier.monthly.lookupKey}
                  badge={tier.badge}
                  featured={tier.featured}
                  description={tier.description}
                  detailsHref="/cloud-pricing"
                  features={tier.features}
                />
              )
            })}
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-3xl text-center">
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
