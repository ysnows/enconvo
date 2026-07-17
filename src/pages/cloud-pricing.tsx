import Head from 'next/head'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Logo } from '@/components/Logo'
import {
  fetchPricingCatalog,
  type BillingFormula,
  type PricingCatalog,
  type PricingOffering,
  type TokenUsageKey,
} from '@/lib/cloud-pricing'

const TOKEN_LABELS: Record<TokenUsageKey, string> = {
  inputTokens: 'Input',
  outputTokens: 'Output',
  cacheWriteTokens: '5m cache write',
  cacheWrite1hTokens: '1h cache write',
  cacheReadTokens: 'Cache read',
  cacheOutputTokens: 'Cache output',
}

const NUMBER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 })
const POINTS = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})
const DATE_SHORT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

function useNow(intervalMs: number = 60_000): Date {
  const [now, setNow] = useState<Date>(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

type PromotionStatus = { kind: 'active' | 'expired' | 'none'; relative: string; absolute: string }

function formatPromotionEndsAt(endsAt: string | undefined, now: Date): PromotionStatus {
  if (!endsAt) return { kind: 'none', relative: '', absolute: '' }
  const end = new Date(endsAt)
  if (Number.isNaN(end.getTime())) return { kind: 'none', relative: '', absolute: '' }
  const diffMs = end.getTime() - now.getTime()
  const absolute = DATE_SHORT.format(end)
  if (diffMs <= 0) return { kind: 'expired', relative: 'expired', absolute }
  const minutes = Math.floor(diffMs / 60_000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  let relative: string
  if (diffMs < 60 * 60 * 1000) relative = `ends in ${Math.max(minutes, 1)} min`
  else if (diffMs < 24 * 60 * 60 * 1000) relative = `ends in ${hours}h ${minutes % 60}m`.trim()
  else relative = `ends in ${days} day${days === 1 ? '' : 's'}`
  return { kind: 'active', relative, absolute }
}

function pointsForUsd(usd: number, usdPerPoint: number) {
  return usdPerPoint > 0 ? usd / usdPerPoint : 0
}

function isFreeFormula(formula: BillingFormula): boolean {
  if (formula.kind === 'provider-reported') return false
  if (formula.kind === 'hybrid') return formula.formulas.every(isFreeFormula)
  if (formula.kind === 'token') {
    const rates = [
      ...Object.values(formula.components),
      ...(formula.tiers || []).flatMap((tier) => Object.values(tier.components)),
    ]
    return rates.every((rate) => !rate || rate.usdPerMillion === 0)
  }
  return formula.usdPerUnit === 0
}

type Tier = 'plus' | 'pro' | 'max'

function effectivePoints(usdPerMillion: number, usdPerPoint: number, discount: number | null) {
  const base = pointsForUsd(usdPerMillion, usdPerPoint)
  return discount == null ? base : base * discount
}

function discountForTier(tier: Tier, offering: PricingOffering): number | null {
  if (!offering.tierDiscounts) return null
  if (tier === 'plus') return null
  return tier === 'pro' ? offering.tierDiscounts.pro : offering.tierDiscounts.max
}

function FormulaSummary({
  offering,
  usdPerPoint,
  activeTier,
  promotion,
}: {
  offering: PricingOffering
  usdPerPoint: number
  activeTier: Tier
  promotion: PromotionStatus
}) {
  const formula = offering.formula
  const discount = discountForTier(activeTier, offering)

  if (isFreeFormula(formula)) {
    if (promotion.kind === 'active') {
      return (
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="rounded-md bg-signal-green/12 px-2 py-0.5 text-[12px] font-medium text-signal-green">Free</span>
            <span className="text-[11px] font-medium text-signal-green" title={promotion.absolute}>{promotion.relative}</span>
          </div>
          <div className="text-[11px] text-content-ash">No points charged · ends {promotion.absolute}</div>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-signal-green/12 px-2 py-0.5 text-[12px] font-medium text-signal-green">Free</span>
        <span className="text-[11px] text-content-ash">No points charged</span>
      </div>
    )
  }

  if (formula.kind === 'token') {
    const entries = Object.entries(formula.components)
      .filter(([, rate]) => rate && rate.usdPerMillion > 0)
    const primary = entries[0]
    if (!primary) return <span className="text-content-muted">—</span>
    const [key, rate] = primary
    const discounted = effectivePoints(rate!.usdPerMillion, usdPerPoint, discount)
    return (
      <div className="space-y-0.5">
        <div className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-[13px] font-medium text-content">{POINTS.format(discounted)} pts</span>
          <span className="text-[11px] text-content-ash">/ 1M {TOKEN_LABELS[key as TokenUsageKey].toLowerCase()}</span>
          {discount != null && discount < 1 && (
            <span className="rounded bg-signal-blue/12 px-1.5 py-px text-[10px] font-medium text-signal-blue">×{discount}</span>
          )}
        </div>
        {entries.length > 1 && (
          <div className="text-[11px] text-content-ash">+ {entries.length - 1} more rate{entries.length - 1 === 1 ? '' : 's'}</div>
        )}
      </div>
    )
  }

  if (formula.kind === 'flat') {
    const points = effectivePoints(formula.usdPerUnit, usdPerPoint, discount)
    return (
      <div>
        <div className="text-[13px] font-medium text-content">{POINTS.format(points)} pts <span className="text-[11px] font-normal text-content-ash">/ {formula.unit}</span></div>
        <div className="text-[11px] text-content-ash">{USD.format(formula.usdPerUnit)} usage equivalent</div>
      </div>
    )
  }

  if (formula.kind === 'duration') {
    const multiplier = formula.unit === 'second' ? 3600 : formula.unit === 'minute' ? 60 : 1
    const hourlyUsd = formula.usdPerUnit * multiplier
    const points = effectivePoints(hourlyUsd, usdPerPoint, discount)
    return (
      <div>
        <div className="text-[13px] font-medium text-content">{POINTS.format(points)} pts <span className="text-[11px] font-normal text-content-ash">/ hour</span></div>
        <div className="text-[11px] text-content-ash">{USD.format(hourlyUsd)} usage equivalent</div>
      </div>
    )
  }

  if (formula.kind === 'hybrid') {
    return <span className="text-content-muted">Multiple usage components</span>
  }

  return <span className="text-content-muted">Actual provider-reported cost</span>
}

function FormulaDetails({ formula, usdPerPoint, activeTier }: { formula: BillingFormula; usdPerPoint: number; activeTier: Tier }) {
  const discount = activeTier === 'plus' ? null : activeTier === 'pro' ? 0.5 : 0.25
  if (formula.kind === 'token') {
    return (
      <div className="overflow-hidden rounded-md border border-hairline">
        {Object.entries(formula.components).map(([key, rate]) => rate && (
          <div key={key} className="grid grid-cols-[1fr_auto] gap-4 border-b border-hairline px-3 py-2 text-xs last:border-b-0">
            <span className="text-content-muted">{TOKEN_LABELS[key as TokenUsageKey]}</span>
            <span className="text-right text-content">
              {POINTS.format(effectivePoints(rate.usdPerMillion, usdPerPoint, discount))} pts / 1M
              <span className="ml-2 text-content-ash">{USD.format(rate.usdPerMillion)}</span>
            </span>
          </div>
        ))}
        {(formula.tiers || []).map((tier) => (
          <div key={tier.aboveTokens} className="border-t border-hairline bg-white/[0.025] px-3 py-2 text-xs text-content-muted">
            <div className="mb-2">Rates above {NUMBER.format(tier.aboveTokens)} input tokens{tier.inputIncludesCacheRead ? ' (including cache reads)' : ''}</div>
            {Object.entries(tier.components).map(([key, rate]) => rate && (
              <div key={key} className="flex justify-between gap-4 py-1">
                <span>{TOKEN_LABELS[key as TokenUsageKey]}</span>
                <span className="text-content">{POINTS.format(effectivePoints(rate.usdPerMillion, usdPerPoint, discount))} pts / 1M <span className="ml-2 text-content-ash">{USD.format(rate.usdPerMillion)}</span></span>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }
  if (formula.kind === 'flat') {
    return <p className="text-xs text-content-muted">Each {formula.unit} costs {POINTS.format(effectivePoints(formula.usdPerUnit, usdPerPoint, discount))} points ({USD.format(formula.usdPerUnit)} usage equivalent).</p>
  }
  if (formula.kind === 'duration') {
    return <p className="text-xs text-content-muted">Measured in {formula.unit}s{formula.billingQuantum ? ` and rounded to ${formula.billingQuantum}-${formula.unit} provider quanta` : ''}. Components are summed before the final point rounding.</p>
  }
  if (formula.kind === 'hybrid') {
    return (
      <div className="space-y-2">
        {formula.formulas.map((part, index) => (
          <FormulaDetails key={index} formula={part} usdPerPoint={usdPerPoint} activeTier={activeTier} />
        ))}
      </div>
    )
  }
  return <p className="text-xs text-content-muted">The provider reports the actual cost after the request.</p>
}

function PricingRow({ offering, catalog, expanded, onToggle, activeTier, now }: {
  offering: PricingOffering
  catalog: PricingCatalog
  expanded: boolean
  onToggle: () => void
  activeTier: Tier
  now: Date
}) {
  const category = catalog.categories.find((item) => item.id === offering.category)
  const promotion = formatPromotionEndsAt(offering.promotion?.endsAt, now)
  const showPromoAccent = isFreeFormula(offering.formula) && promotion.kind === 'active'
  return (
    <div className={`group/row relative border-b border-hairline last:border-b-0 ${showPromoAccent ? 'before:absolute before:bottom-0 before:left-0 before:top-0 before:w-[2px] before:bg-signal-green/70' : ''}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="group grid w-full grid-cols-[minmax(0,1fr)_24px] items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03] focus-visible:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal-blue/40 sm:grid-cols-[minmax(0,1.4fr)_minmax(96px,.55fr)_minmax(180px,.9fr)_28px] sm:gap-4 sm:px-5"
      >
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-medium text-content">{offering.title}</span>
            {showPromoAccent && (
              <span
                className="shrink-0 rounded border border-signal-green/30 bg-signal-green/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-signal-green"
                title={`Free until ${promotion.absolute}`}
              >
                Limited
              </span>
            )}
            {offering.promotion?.type === 'new' && <span className="rounded border border-signal-green/30 bg-signal-green/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-signal-green">New</span>}
            {offering.tierDiscounts && <span className="rounded border border-signal-blue/30 bg-signal-blue/10 px-1.5 py-0.5 text-[9px] font-medium tracking-wider text-signal-blue" title="Pro ½ · Max ¼ on boost models">Boost</span>}
            {offering.status === 'preview' && <span className="rounded border border-signal-yellow/30 bg-signal-yellow/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-signal-yellow">Preview</span>}
            {offering.status === 'deprecated' && <span className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-content-ash">Legacy</span>}
          </div>
          <div className="mt-1 truncate text-[11px] text-content-ash">
            {category?.label}<span className="sm:hidden"> · {offering.provider}</span>
          </div>
        </div>
        <div className="hidden truncate text-xs text-content-muted sm:block">{offering.provider}</div>
        <div className="min-w-0 text-xs"><FormulaSummary offering={offering} usdPerPoint={catalog.pointPolicy.usdPerPoint} activeTier={activeTier} promotion={promotion} /></div>
        <svg className={`h-4 w-4 text-content-ash transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>
      </button>
      {expanded && (
        <div className="border-t border-hairline bg-white/[0.02] px-4 py-5 sm:px-5">
          <div className="max-w-2xl">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-content-ash">Billing formula</div>
              {offering.tierDiscounts && (
                <div className="text-[10px] text-content-ash">Viewing at <span className="text-content">{activeTier === 'plus' ? 'Plus (no boost)' : activeTier === 'pro' ? 'Pro' : 'Max'}</span></div>
              )}
            </div>
            <div className="mt-3"><FormulaDetails formula={offering.formula} usdPerPoint={catalog.pointPolicy.usdPerPoint} activeTier={activeTier} /></div>
            {offering.description && <p className="mt-3 text-xs leading-5 text-content-muted">{offering.description}</p>}
            {(offering.promotion || showPromoAccent) && (
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-signal-green/25 bg-signal-green/[0.06] px-2.5 py-2 text-[12px] text-signal-green">
                <span aria-hidden="true">⏱</span>
                <span className="font-medium">{offering.promotion?.label ?? 'Limited-time free'}</span>
                {offering.promotion?.startsAt && <span className="text-signal-green/80">from {DATE_SHORT.format(new Date(offering.promotion.startsAt))}</span>}
                {promotion.kind === 'active' && <span className="text-signal-green/80">until {promotion.absolute} · {promotion.relative}</span>}
                {promotion.kind === 'expired' && <span className="text-signal-green/80">ended {promotion.absolute}</span>}
              </div>
            )}
            {offering.source?.url && (
              <p className="mt-3 text-[11px] text-content-ash">
                Source: <a href={offering.source.url} target="_blank" rel="noopener noreferrer" className="text-content-muted underline-offset-2 hover:text-content hover:underline">{offering.source.label}</a>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CatalogSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline">
      <div className="hidden h-9 border-b border-hairline bg-white/[0.025] sm:block" />
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <div key={row} className="grid grid-cols-1 gap-3 border-b border-hairline px-4 py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,1.4fr)_minmax(96px,.55fr)_minmax(180px,.9fr)_28px] sm:gap-4 sm:px-5">
          <div className="space-y-1.5">
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-white/[0.07]" />
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-white/[0.04]" />
          </div>
          <div className="hidden h-3.5 w-3/4 animate-pulse rounded bg-white/[0.05] sm:block" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-1/2 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-2.5 w-2/3 animate-pulse rounded bg-white/[0.04]" />
          </div>
          <div className="hidden h-3.5 w-3.5 animate-pulse rounded bg-white/[0.05] sm:block" />
        </div>
      ))}
    </div>
  )
}

const TIERS: Array<{
  id: Tier
  name: string
  monthly: string
  annual: string
  points: string
  boost: { multiplier: number; cap: string } | null
  soon?: boolean
  highlight?: boolean
}> = [
  { id: 'plus', name: 'Plus', monthly: '$10', annual: '$96/yr', points: '500K points / month', boost: null },
  { id: 'pro', name: 'Pro', monthly: '$50', annual: '$480/yr', points: '2.5M points / month', boost: { multiplier: 0.5, cap: 'up to 5M points' }, highlight: true },
  { id: 'max', name: 'Max', monthly: '$100', annual: '$960/yr', points: '5M points / month', boost: { multiplier: 0.25, cap: 'up to 20M points' } },
]

export default function CloudPricingPage() {
  const [catalog, setCatalog] = useState<PricingCatalog | null>(null)
  const [loadError, setLoadError] = useState('')
  const [lastAttempt, setLastAttempt] = useState<Date | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [provider, setProvider] = useState('all')
  const [status, setStatus] = useState('all')
  const [showLegacy, setShowLegacy] = useState(false)
  const [freeOnly, setFreeOnly] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeTier, setActiveTier] = useState<Tier>('plus')
  const now = useNow(60_000)

  useEffect(() => {
    const controller = new AbortController()
    setLoadError('')
    setLastAttempt(new Date())
    fetchPricingCatalog(controller.signal)
      .then(setCatalog)
      .catch((error) => {
        if (error.name !== 'AbortError') setLoadError(error.message)
      })
    return () => controller.abort()
  }, [reloadKey])

  const filteredOfferings = useMemo(() => {
    if (!catalog) return []
    const query = search.trim().toLowerCase()
    return catalog.offerings.filter((offering) => {
      if (!showLegacy && offering.status === 'deprecated') return false
      if (category !== 'all' && offering.category !== category) return false
      if (provider !== 'all' && offering.provider !== provider) return false
      if (status !== 'all' && offering.status !== status) return false
      if (freeOnly && !isFreeFormula(offering.formula)) return false
      if (query && !`${offering.title} ${offering.provider} ${offering.category}`.toLowerCase().includes(query)) return false
      return true
    })
  }, [catalog, category, provider, search, showLegacy, status, freeOnly])

  const hasActiveFilters = search.trim() !== '' || category !== 'all' || provider !== 'all' || status !== 'all' || showLegacy || freeOnly

  const clearFilters = useCallback(() => {
    setSearch('')
    setCategory('all')
    setProvider('all')
    setStatus('all')
    setShowLegacy(false)
    setFreeOnly(false)
  }, [])

  return (
    <div className="min-h-screen bg-canvas text-content">
      <Head>
        <title>Enconvo Cloud Pricing — Models & Services</title>
        <meta name="description" content="Current Enconvo Cloud point prices for language models, image and video generation, speech, search, and document services." />
        <link rel="canonical" href="https://enconvo.com/cloud-pricing" />
      </Head>

      <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Enconvo home" className="flex items-center gap-2.5 transition-opacity hover:opacity-80"><Logo className="h-7 w-auto" /><span className="text-sm font-semibold text-content">Enconvo</span></Link>
          <nav className="flex items-center gap-1 text-xs">
            <Link href="/pricing" className="inline-flex h-11 items-center rounded-md px-3 text-content-muted transition hover:bg-white/[0.04] hover:text-content">Plans</Link>
            <Link href="/cloud-points" className="inline-flex h-11 items-center rounded-md border border-hairline bg-surface-elevated px-3 text-content transition hover:border-hairline-strong">Top up points</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 sm:pb-16 sm:pt-24 lg:px-8">
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_440px]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-signal-blue/25 bg-signal-blue/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-signal-blue">
                <span className="h-1.5 w-1.5 rounded-full bg-signal-blue" />
                Enconvo Cloud
              </div>
              <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] text-content sm:text-6xl">
                Every model and service,<br className="hidden sm:block" />
                <span className="text-content-muted"> priced in one place.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-content-muted sm:text-lg">
                Use hosted AI without managing provider keys. Prices below come directly from the same catalog Enconvo uses to calculate Cloud point charges — including boost-model discounts for Pro and Max tiers.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/pricing" className="inline-flex h-11 items-center rounded-md bg-content px-4 text-sm font-semibold text-canvas transition hover:bg-white">View Cloud plans</Link>
                <Link href="/cloud-points" className="inline-flex h-11 items-center rounded-md border border-hairline bg-surface-elevated px-4 text-sm font-medium text-content transition hover:border-hairline-strong">Top up points</Link>
              </div>
            </div>
            <div className="rounded-xl border border-hairline bg-surface-elevated/60 p-6">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-content-ash">Point conversion</div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tabular-nums text-content">
                  {catalog ? POINTS.format(catalog.pointPolicy.pointsPerUsd) : '—'}
                </span>
                <span className="text-base text-content-muted">points</span>
              </div>
              <div className="mt-1 text-sm text-content-ash">= $1.00 USD usage equivalent</div>
              {catalog && (
                <div className="mt-4 flex items-center justify-between rounded-lg border border-hairline bg-canvas/40 px-3 py-2.5">
                  <div className="text-xs text-content-muted">Cloud Plan allowance</div>
                  <div className="text-sm font-medium tabular-nums text-content">{POINTS.format(catalog.cloudPolicy.cloudPlanAllowancePoints)} pts / mo</div>
                </div>
              )}
              <p className="mt-4 text-[11px] leading-5 text-content-ash">
                USD values are usage equivalents for comparison, not a separate checkout. Components stay at full precision and are rounded once after summing; positive paid charges have a 1-point minimum.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-hairline bg-surface/60">
          <div className="mx-auto grid max-w-7xl divide-y divide-hairline px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
            {[
              { label: 'One catalog', text: 'Pricing and billing share the same formulas.' },
              { label: 'Actual usage', text: 'Tokens, units, or duration settle the charge.' },
              { label: 'Auditable', text: 'Each charge stores its pricing snapshot.' },
            ].map((item) => (
              <div key={item.label} className="py-4 sm:px-6 first:sm:pl-0 last:sm:pr-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-content-ash">{item.label}</div>
                <div className="mt-1 text-sm text-content">{item.text}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 sm:pt-20 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-content sm:text-3xl">Cloud plans</h2>
              <p className="mt-2 max-w-2xl text-sm text-content-muted">
                Every tier includes hosted AI with no API keys. Higher tiers add more monthly points and cheaper usage on boost models — DeepSeek V4 and MiniMax M3.
              </p>
            </div>
            <Link href="/pricing" className="hidden text-sm text-content-muted underline-offset-4 hover:text-content hover:underline sm:inline">Compare full plan details →</Link>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {TIERS.map((tier) => {
              const isActive = activeTier === tier.id
              return (
                <button
                  type="button"
                  key={tier.id}
                  onClick={() => setActiveTier(tier.id)}
                  aria-pressed={isActive}
                  className={`group relative flex flex-col rounded-xl border p-6 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue/40 ${isActive ? 'border-signal-blue/50 bg-signal-blue/[0.06]' : tier.highlight ? 'border-signal-blue/30 bg-signal-blue/[0.03] hover:border-signal-blue/40' : 'border-hairline bg-surface-elevated/60 hover:border-hairline-strong'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-content">{tier.name}</span>
                      {tier.soon && <span className="rounded border border-hairline bg-canvas/40 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-content-ash">Soon</span>}
                      {tier.highlight && <span className="rounded border border-signal-blue/40 bg-signal-blue/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-signal-blue">Popular</span>}
                    </div>
                    <div className={`h-4 w-4 rounded-full border transition ${isActive ? 'border-signal-blue bg-signal-blue' : 'border-hairline group-hover:border-hairline-strong'}`}>
                      {isActive && <span className="block h-full w-full scale-50 rounded-full bg-canvas" />}
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold tabular-nums text-content">{tier.monthly}</span>
                    <span className="text-xs text-content-ash">/mo · {tier.annual} annual</span>
                  </div>
                  <div className="mt-3 text-sm text-content">{tier.points}</div>
                  {tier.boost ? (
                    <div className="mt-3 inline-flex items-start gap-2 rounded-md border border-signal-green/25 bg-signal-green/[0.06] px-2.5 py-2 text-[12px] text-signal-green">
                      <span aria-hidden="true">⚡</span>
                      <span>Boost models at <strong className="font-semibold">1/{Math.round(1 / tier.boost.multiplier)}</strong> price · {tier.boost.cap}</span>
                    </div>
                  ) : (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-hairline bg-canvas/40 px-2.5 py-2 text-[12px] text-content-muted">
                      Standard pricing on all models
                    </div>
                  )}
                  <div className="mt-3 text-[11px] text-content-ash">5 Mac devices · live catalog prices</div>
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-[11px] text-content-ash">
            Choose a tier to preview effective point prices across the catalog below. Settlement always uses the highest tier on your active subscription.
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-semibold text-content sm:text-3xl">Cloud pricing catalog</h2>
              <p className="mt-2 max-w-2xl text-sm text-content-muted">
                Active and preview services by default. Pick a tier above to preview boost discounts, then expand any row for the full billing formula.
              </p>
            </div>
            {catalog && (
              <div className="flex items-center gap-2 text-[11px] text-content-ash">
                <span className="h-1.5 w-1.5 rounded-full bg-signal-green" />
                Updated {new Date(catalog.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            )}
          </div>

          <div className="mt-8 rounded-xl border border-hairline bg-surface-elevated/40 p-3">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,180px)]">
                <label className="relative block">
                  <span className="sr-only">Search services</span>
                  <svg className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-content-ash" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></svg>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search models, providers, or services"
                    className="h-11 w-full rounded-md border border-hairline bg-canvas pl-9 pr-3 text-sm text-content outline-none placeholder:text-content-ash transition focus:border-signal-blue/60 focus:ring-1 focus:ring-signal-blue/30"
                  />
                </label>
                <select
                  value={provider}
                  onChange={(event) => setProvider(event.target.value)}
                  className="h-11 rounded-md border border-hairline bg-canvas px-3 text-sm text-content outline-none transition focus:border-signal-blue/60 focus:ring-1 focus:ring-signal-blue/30"
                  aria-label="Filter by provider"
                >
                  <option value="all">All providers</option>
                  {catalog?.providers.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={status}
                  onChange={(event) => {
                    const next = event.target.value
                    setStatus(next)
                    if (next === 'deprecated') setShowLegacy(true)
                  }}
                  className="h-11 rounded-md border border-hairline bg-canvas px-3 text-sm text-content outline-none transition focus:border-signal-blue/60 focus:ring-1 focus:ring-signal-blue/30"
                  aria-label="Filter by service status"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="preview">Preview</option>
                  <option value="deprecated">Legacy</option>
                </select>
                <label className="flex h-11 cursor-pointer items-center gap-2 rounded-md px-2 text-xs text-content-muted transition hover:bg-white/[0.04]">
                  <input
                    type="checkbox"
                    checked={freeOnly}
                    onChange={(event) => setFreeOnly(event.target.checked)}
                    className="h-4 w-4 rounded border-hairline bg-canvas text-signal-green focus:ring-signal-green/40"
                  />
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="rounded bg-signal-green/15 px-1 text-[10px] font-semibold uppercase tracking-wider text-signal-green">Free</span>
                    only
                  </span>
                </label>
                <label className="flex h-11 cursor-pointer items-center gap-2 rounded-md px-2 text-xs text-content-muted transition hover:bg-white/[0.04]">
                  <input
                    type="checkbox"
                    checked={showLegacy}
                    onChange={(event) => {
                      const checked = event.target.checked
                      setShowLegacy(checked)
                      if (!checked && status === 'deprecated') setStatus('all')
                    }}
                    className="h-4 w-4 rounded border-hairline bg-canvas text-signal-blue focus:ring-signal-blue/40"
                  />
                  Show legacy
                </label>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex h-11 items-center rounded-md px-3 text-xs text-content-muted underline-offset-2 transition hover:text-content hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
              <button
                type="button"
                onClick={() => setCategory('all')}
                aria-pressed={category === 'all'}
                className={`inline-flex h-9 items-center whitespace-nowrap rounded-md px-3 text-[12px] font-medium transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal-blue/40 ${category === 'all' ? 'bg-content text-canvas' : 'text-content-muted hover:bg-white/[0.04] hover:text-content'}`}
              >
                All
              </button>
              {catalog?.categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  aria-pressed={category === item.id}
                  className={`inline-flex h-9 items-center whitespace-nowrap rounded-md px-3 text-[12px] font-medium transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal-blue/40 ${category === item.id ? 'bg-content text-canvas' : 'text-content-muted hover:bg-white/[0.04] hover:text-content'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            {!catalog && !loadError && <CatalogSkeleton />}
            {loadError && (
              <div className="rounded-xl border border-signal-red/25 bg-signal-red/[0.06] px-5 py-10 text-center">
                <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full border border-signal-red/30 bg-signal-red/10 text-signal-red">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M10 6v4m0 4h.01M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" /></svg>
                </div>
                <p className="text-sm font-medium text-content">{loadError}</p>
                <p className="mt-1 text-xs text-content-muted">We don&apos;t show cached or guessed prices when the billing catalog is unavailable.</p>
                {lastAttempt && <p className="mt-2 text-[11px] text-content-ash">Last attempted {lastAttempt.toLocaleString('en-US')}</p>}
                <button
                  type="button"
                  onClick={() => setReloadKey((key) => key + 1)}
                  className="mt-5 inline-flex h-10 items-center rounded-md border border-hairline-strong bg-canvas px-4 text-xs font-medium text-content transition hover:border-signal-blue/40 hover:text-signal-blue"
                >
                  Try again
                </button>
              </div>
            )}
            {catalog && (
              <div className="overflow-hidden rounded-xl border border-hairline bg-surface/40">
                <div className="hidden border-b border-hairline bg-white/[0.025] px-5 py-2.5 sm:grid sm:grid-cols-[minmax(0,1.4fr)_minmax(96px,.55fr)_minmax(180px,.9fr)_28px] sm:gap-4">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-content-ash">Service</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-content-ash">Provider</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-content-ash">
                    Price{activeTier !== 'plus' && <span className="ml-1 normal-case tracking-normal text-signal-blue">· {activeTier === 'pro' ? 'Pro' : 'Max'} boost</span>}
                  </span>
                  <span />
                </div>
                {filteredOfferings.length > 0 ? (
                  filteredOfferings.map((offering) => (
                    <PricingRow
                      key={offering.id}
                      offering={offering}
                      catalog={catalog}
                      expanded={expandedId === offering.id}
                      onToggle={() => setExpandedId((current) => (current === offering.id ? null : offering.id))}
                      activeTier={activeTier}
                      now={now}
                    />
                  ))
                ) : (
                  <div className="px-5 py-16 text-center">
                    <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full border border-hairline bg-canvas text-content-ash">
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></svg>
                    </div>
                    <p className="text-sm font-medium text-content">No services match these filters.</p>
                    <p className="mt-1 text-xs text-content-muted">Try a different category, provider, or search term.</p>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-4 inline-flex h-10 items-center rounded-md border border-hairline-strong bg-canvas px-4 text-xs font-medium text-content transition hover:border-signal-blue/40 hover:text-signal-blue"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
            {catalog && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-content-ash">
                <span>
                  {POINTS.format(filteredOfferings.length)} of {POINTS.format(catalog.offerings.length)} offerings visible
                </span>
                <span className="font-mono opacity-70">Catalog {catalog.catalogVersion.slice(7, 23)}…</span>
              </div>
            )}
          </div>
        </section>

        {catalog && (
          <section className="border-t border-hairline bg-surface/30">
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
              <div className="max-w-2xl">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-signal-blue">Cloud point policy</div>
                <h2 className="mt-3 text-2xl font-semibold text-content sm:text-3xl">How Cloud points work</h2>
                <p className="mt-3 text-sm leading-6 text-content-muted">
                  The allowance and spending rules below are part of the live billing catalog, alongside every model formula.
                </p>
              </div>
              <div className="mt-8 grid overflow-hidden rounded-xl border border-hairline bg-surface-elevated/40 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { value: POINTS.format(catalog.cloudPolicy.cloudPlanAllowancePoints), label: 'Cloud Plan points are added for each monthly allowance period.', large: true },
                  { value: 'Monthly reset', label: 'Unused subscription allowance does not roll over and expires when the allowance resets.', large: false },
                  { value: 'Subscription first', label: 'Charges spend the subscription allowance before using purchased top-up points.', large: false },
                  { value: 'Top-ups stay', label: 'Purchased top-up points do not expire, but cannot be transferred or redeemed for cash.', large: false },
                ].map((card, i) => (
                  <div key={i} className="border-b border-hairline p-5 last:border-b-0 sm:border-r lg:border-b-0">
                    <div className={`text-content ${card.large ? 'text-2xl font-semibold tabular-nums' : 'text-sm font-medium'}`}>{card.value}</div>
                    <p className="mt-2 text-xs leading-5 text-content-muted">{card.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="border-t border-hairline">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-signal-blue">How billing works</div>
                <h2 className="mt-3 text-2xl font-semibold text-content sm:text-3xl">Clear formulas. Exact settlement.</h2>
                <p className="mt-4 text-sm leading-6 text-content-muted">
                  Every settled charge records the exact formula, measured usage, and catalog version that produced it.
                </p>
                <ol className="mt-8 space-y-6">
                  {[
                    { n: '01', title: 'Measure usage', text: 'The provider reports tokens, generated units, duration, or actual cost.' },
                    { n: '02', title: 'Evaluate once', text: 'Provider quanta are applied first. All formula components are then summed at full precision.' },
                    { n: '03', title: 'Settle points', text: 'The final total is rounded once to the nearest point and written with an immutable billing snapshot.' },
                  ].map((step) => (
                    <li key={step.n} className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-hairline bg-surface-elevated text-[11px] font-mono text-content-ash">{step.n}</span>
                      <div>
                        <h3 className="text-sm font-medium text-content">{step.title}</h3>
                        <p className="mt-1 text-xs leading-5 text-content-muted">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-signal-blue">FAQ</div>
                <h2 className="mt-3 text-2xl font-semibold text-content sm:text-3xl">Charges, failures, and corrections</h2>
                <div className="mt-8 divide-y divide-hairline border-y border-hairline">
                  {[
                    ['When are points charged?', 'Successful synchronous requests settle from their measured usage. Asynchronous jobs settle when a billable result is completed. Duplicate delivery is deduplicated before changing the balance.'],
                    ['What happens when a request fails?', 'A request that fails before producing a billable provider outcome is not charged. If a provider confirms partial usage from an interrupted stream, that measured partial usage may be charged.'],
                    ['Why can the final charge vary between requests?', 'Each response can contain different token counts, duration, generated units, cache usage, or provider-reported costs. The final one-time point rounding is applied only after every component is known.'],
                    ['How are refunds or billing corrections handled?', 'Corrections are recorded as linked reversal entries so the original charge and its pricing snapshot remain auditable. Contact support if a settled charge does not match the service result.'],
                    ['Do top-up points expire?', catalog ? `Purchased top-up points do not expire until used. The ${POINTS.format(catalog.cloudPolicy.cloudPlanAllowancePoints)}-point Cloud Plan allowance resets monthly and unused allowance does not roll over.` : 'Point policy is shown only when the live billing catalog is available.'],
                  ].map(([question, answer]) => (
                    <details key={question} className="group py-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-content transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal-blue/40">
                        <span>{question}</span>
                        <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-hairline text-content-ash transition group-open:rotate-45 group-open:border-hairline-strong">
                          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 1.5v9M1.5 6h9" /></svg>
                        </span>
                      </summary>
                      <p className="max-w-2xl pt-3 text-xs leading-6 text-content-muted">{answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-hairline">
          <div className="absolute inset-0 bg-gradient-to-br from-signal-blue/[0.08] via-transparent to-signal-green/[0.05]" aria-hidden="true" />
          <div className="relative mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 py-16 sm:flex-row sm:items-center sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold text-content sm:text-3xl">Ready to use Enconvo Cloud?</h2>
              <p className="mt-3 text-sm leading-6 text-content-muted">
                Start with a recurring plan and add points whenever you need extra headroom. Cancel anytime — top-up points never expire.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/pricing" className="inline-flex h-11 items-center rounded-md bg-content px-5 text-sm font-semibold text-canvas transition hover:bg-white">Compare plans</Link>
              <Link href="/cloud-points" className="inline-flex h-11 items-center rounded-md border border-hairline-strong bg-canvas px-5 text-sm font-medium text-content transition hover:border-signal-blue/40 hover:text-signal-blue">Top up points</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}