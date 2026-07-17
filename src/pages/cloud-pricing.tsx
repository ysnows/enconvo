import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
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
const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 6,
})

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

function FormulaSummary({
  offering,
  usdPerPoint,
}: {
  offering: PricingOffering
  usdPerPoint: number
}) {
  const formula = offering.formula
  if (isFreeFormula(formula)) return <span className="text-signal-green">Free</span>

  if (formula.kind === 'token') {
    const entries = Object.entries(formula.components)
      .filter(([, rate]) => rate && rate.usdPerMillion > 0)
    return (
      <div className="space-y-1">
        {entries.slice(0, 2).map(([key, rate]) => (
          <div key={key} className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-content">
              {NUMBER.format(pointsForUsd(rate!.usdPerMillion, usdPerPoint))} pts
              <span className="text-content-ash"> / 1M {TOKEN_LABELS[key as TokenUsageKey].toLowerCase()}</span>
            </span>
            <span className="text-[11px] text-content-ash">{USD.format(rate!.usdPerMillion)}</span>
          </div>
        ))}
        {entries.length > 2 && (
          <div className="text-[11px] text-content-ash">+ {entries.length - 2} cache rate{entries.length - 2 === 1 ? '' : 's'}</div>
        )}
      </div>
    )
  }

  if (formula.kind === 'flat') {
    const points = pointsForUsd(formula.usdPerUnit, usdPerPoint)
    return (
      <div>
        <div className="text-content">{NUMBER.format(points)} pts <span className="text-content-ash">/ {formula.unit}</span></div>
        <div className="text-[11px] text-content-ash">{USD.format(formula.usdPerUnit)} usage equivalent</div>
      </div>
    )
  }

  if (formula.kind === 'duration') {
    const multiplier = formula.unit === 'second' ? 3600 : formula.unit === 'minute' ? 60 : 1
    const hourlyUsd = formula.usdPerUnit * multiplier
    return (
      <div>
        <div className="text-content">{NUMBER.format(pointsForUsd(hourlyUsd, usdPerPoint))} pts <span className="text-content-ash">/ hour</span></div>
        <div className="text-[11px] text-content-ash">{USD.format(hourlyUsd)} usage equivalent</div>
      </div>
    )
  }

  if (formula.kind === 'hybrid') {
    return <span className="text-content">Multiple usage components</span>
  }

  return <span className="text-content">Actual provider-reported cost</span>
}

function FormulaDetails({ formula, usdPerPoint }: { formula: BillingFormula; usdPerPoint: number }) {
  if (formula.kind === 'token') {
    return (
      <div className="overflow-hidden rounded-md border border-hairline">
        {Object.entries(formula.components).map(([key, rate]) => rate && (
          <div key={key} className="grid grid-cols-[1fr_auto] gap-4 border-b border-hairline px-3 py-2 text-xs last:border-b-0">
            <span className="text-content-muted">{TOKEN_LABELS[key as TokenUsageKey]}</span>
            <span className="text-right text-content">
              {NUMBER.format(pointsForUsd(rate.usdPerMillion, usdPerPoint))} pts / 1M
              <span className="ml-2 text-content-ash">{USD.format(rate.usdPerMillion)}</span>
            </span>
          </div>
        ))}
        {(formula.tiers || []).map((tier) => (
          <div key={tier.aboveTokens} className="border-t border-hairline bg-white/[0.02] px-3 py-2 text-xs text-content-muted">
            <div className="mb-2">Rates above {NUMBER.format(tier.aboveTokens)} input tokens{tier.inputIncludesCacheRead ? ' (including cache reads)' : ''}</div>
            {Object.entries(tier.components).map(([key, rate]) => rate && (
              <div key={key} className="flex justify-between gap-4 py-1">
                <span>{TOKEN_LABELS[key as TokenUsageKey]}</span>
                <span className="text-content">{NUMBER.format(pointsForUsd(rate.usdPerMillion, usdPerPoint))} pts / 1M <span className="ml-2 text-content-ash">{USD.format(rate.usdPerMillion)}</span></span>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }
  if (formula.kind === 'flat') {
    return <p className="text-xs text-content-muted">Each {formula.unit} costs {NUMBER.format(pointsForUsd(formula.usdPerUnit, usdPerPoint))} points ({USD.format(formula.usdPerUnit)} usage equivalent).</p>
  }
  if (formula.kind === 'duration') {
    return <p className="text-xs text-content-muted">Measured in {formula.unit}s{formula.billingQuantum ? ` and rounded to ${formula.billingQuantum}-${formula.unit} provider quanta` : ''}. Components are summed before the final point rounding.</p>
  }
  if (formula.kind === 'hybrid') {
    return (
      <div className="space-y-2">
        {formula.formulas.map((part, index) => (
          <FormulaDetails key={index} formula={part} usdPerPoint={usdPerPoint} />
        ))}
      </div>
    )
  }
  return <p className="text-xs text-content-muted">The provider reports the actual cost after the request.</p>
}

function PricingRow({ offering, catalog, expanded, onToggle }: {
  offering: PricingOffering
  catalog: PricingCatalog
  expanded: boolean
  onToggle: () => void
}) {
  const category = catalog.categories.find((item) => item.id === offering.category)
  return (
    <div className="border-b border-hairline last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="grid w-full grid-cols-[minmax(0,1fr)_minmax(118px,.85fr)_24px] items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.025] sm:grid-cols-[minmax(0,1.35fr)_minmax(100px,.65fr)_minmax(190px,1fr)_32px] sm:gap-4 sm:px-5"
      >
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-medium text-content">{offering.title}</span>
            {offering.promotion?.type === 'new' && <span className="rounded border border-signal-green/30 bg-signal-green/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-signal-green">New</span>}
            {offering.status === 'preview' && <span className="rounded border border-signal-yellow/30 bg-signal-yellow/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-signal-yellow">Preview</span>}
            {offering.status === 'deprecated' && <span className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-content-ash">Legacy</span>}
          </div>
          <div className="mt-1 truncate text-[11px] text-content-ash">
            {category?.label}<span className="sm:hidden"> · {offering.provider}</span>
          </div>
        </div>
        <div className="hidden truncate text-xs text-content-muted sm:block">{offering.provider}</div>
        <div className="min-w-0 text-xs"><FormulaSummary offering={offering} usdPerPoint={catalog.pointPolicy.usdPerPoint} /></div>
        <svg className={`h-4 w-4 text-content-ash transition ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>
      </button>
      {expanded && (
        <div className="border-t border-hairline bg-white/[0.018] px-4 py-5 sm:px-5">
          <div className="max-w-2xl">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-content-ash">Billing formula</div>
            <div className="mt-3"><FormulaDetails formula={offering.formula} usdPerPoint={catalog.pointPolicy.usdPerPoint} /></div>
            {offering.description && <p className="mt-3 text-xs leading-5 text-content-muted">{offering.description}</p>}
            {offering.promotion && <p className="mt-3 text-xs text-signal-green">{offering.promotion.label}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function CatalogSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-hairline">
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <div key={row} className="grid grid-cols-[1fr_.8fr] gap-4 border-b border-hairline px-4 py-4 last:border-b-0 sm:grid-cols-[1.4fr_.6fr_1fr] sm:px-5">
          <div className="h-4 animate-pulse rounded bg-white/[0.07]" />
          <div className="hidden h-4 animate-pulse rounded bg-white/[0.05] sm:block" />
          <div className="h-4 animate-pulse rounded bg-white/[0.05]" />
        </div>
      ))}
    </div>
  )
}

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
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
      if (query && !`${offering.title} ${offering.provider} ${offering.category}`.toLowerCase().includes(query)) return false
      return true
    })
  }, [catalog, category, provider, search, showLegacy, status])

  return (
    <div className="min-h-screen bg-canvas text-content">
      <Head>
        <title>Enconvo Cloud Pricing — Models & Services</title>
        <meta name="description" content="Current Enconvo Cloud point prices for language models, image and video generation, speech, search, and document services." />
        <link rel="canonical" href="https://enconvo.com/cloud-pricing" />
      </Head>

      <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Enconvo home" className="flex items-center gap-2.5"><Logo className="h-7 w-auto" /><span className="text-sm font-semibold text-content">Enconvo</span></Link>
          <nav className="flex items-center gap-1 text-xs">
            <Link href="/pricing" className="inline-flex h-11 items-center rounded-md px-3 text-content-muted transition hover:bg-white/[0.04] hover:text-content">Plans</Link>
            <Link href="/cloud-points" className="inline-flex h-11 items-center rounded-md border border-hairline bg-surface-elevated px-3 text-content transition hover:border-hairline-strong">Top up points</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 sm:pb-16 sm:pt-24 lg:px-8">
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_420px]">
            <div>
              <div className="mb-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-signal-blue">Enconvo Cloud</div>
              <h1 className="max-w-4xl text-4xl font-semibold text-content sm:text-6xl">Every model and service, priced in one place.</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-content-muted sm:text-lg">Use hosted AI without managing provider keys. Prices below come directly from the same catalog Enconvo uses to calculate Cloud point charges.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="https://www.enconvo.com/#pricing" className="inline-flex h-11 items-center rounded-md bg-content px-4 text-sm font-semibold text-canvas transition hover:bg-white">View Cloud plans</Link>
                <Link href="/cloud-points" className="inline-flex h-11 items-center rounded-md border border-hairline bg-surface-elevated px-4 text-sm font-medium text-content transition hover:border-hairline-strong">Top up points</Link>
              </div>
            </div>
            <div className="border-l border-hairline pl-6">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-content-ash">Point conversion</div>
              <div className="mt-3 text-3xl font-semibold text-content">{catalog ? NUMBER.format(catalog.pointPolicy.pointsPerUsd) : 'Live'} points <span className="text-content-ash">= $1</span></div>
              {catalog && <div className="mt-2 text-sm text-content">Cloud Plan includes {NUMBER.format(catalog.cloudPolicy.cloudPlanAllowancePoints)} points each month.</div>}
              <p className="mt-3 text-xs leading-5 text-content-muted">USD values are usage equivalents for comparison, not a separate checkout price. Formula components stay at full precision and are rounded once after summing; a positive paid charge has a one-point minimum.</p>
            </div>
          </div>
        </section>

        <section className="border-y border-hairline bg-surface/60">
          <div className="mx-auto grid max-w-7xl divide-y divide-hairline px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
            <div className="py-4 sm:pr-6"><div className="text-[10px] uppercase tracking-wider text-content-ash">One catalog</div><div className="mt-1 text-sm text-content">Pricing and billing share the same formulas.</div></div>
            <div className="py-4 sm:px-6"><div className="text-[10px] uppercase tracking-wider text-content-ash">Actual usage</div><div className="mt-1 text-sm text-content">Tokens, units, or duration settle the charge.</div></div>
            <div className="py-4 sm:pl-6"><div className="text-[10px] uppercase tracking-wider text-content-ash">Auditable</div><div className="mt-1 text-sm text-content">Each charge stores its pricing snapshot.</div></div>
          </div>
        </section>

        {/* Cloud tiers (ADR 0034): Plus / Pro / Max. Pro & Max launch once their Stripe prices go live. */}
        <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 sm:pt-20 lg:px-8">
          <h2 className="text-2xl font-semibold text-content">Cloud plans</h2>
          <p className="mt-2 text-sm text-content-muted">Every tier includes hosted AI with no API keys. Higher tiers add more monthly points and cheaper usage on boost models — DeepSeek V4 and MiniMax M3.</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {[
              {
                name: 'Plus', monthly: '$10', annual: '$96/yr', points: '500,000 points / month',
                boost: null, soon: false, highlight: false,
              },
              {
                name: 'Pro', monthly: '$50', annual: '$480/yr', points: '2,500,000 points / month',
                boost: 'DeepSeek & MiniMax M3 at 1/2 price — up to 5M points of usage', soon: true, highlight: true,
              },
              {
                name: 'Max', monthly: '$100', annual: '$960/yr', points: '5,000,000 points / month',
                boost: 'DeepSeek & MiniMax M3 at 1/4 price — up to 20M points of usage', soon: true, highlight: false,
              },
            ].map((tier) => (
              <div key={tier.name} className={`relative rounded-lg border p-6 ${tier.highlight ? 'border-signal-blue/40 bg-signal-blue/[0.04]' : 'border-hairline bg-surface-elevated'}`}>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-content">{tier.name}</div>
                  {tier.soon && <span className="rounded border border-hairline px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-content-ash">Coming soon</span>}
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-content">{tier.monthly}</span>
                  <span className="text-xs text-content-ash">/month · {tier.annual} billed annually</span>
                </div>
                <div className="mt-4 text-sm text-content">{tier.points}</div>
                {tier.boost && <div className="mt-2 text-sm text-signal-green">⚡ {tier.boost}</div>}
                <div className="mt-2 text-xs text-content-muted">5 Mac devices · all catalog models at the prices below</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><h2 className="text-2xl font-semibold text-content">Cloud pricing catalog</h2><p className="mt-2 text-sm text-content-muted">Active and preview services are shown by default. Expand a row for the full billing formula.</p></div>
            {catalog && <div className="text-[11px] text-content-ash">Updated {new Date(catalog.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>}
          </div>

          <div className="mt-8 rounded-lg border border-hairline bg-surface/70 p-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="relative block min-w-0 flex-1">
                <span className="sr-only">Search services</span>
                <svg className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-content-ash" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></svg>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search models, providers, or services" className="h-11 w-full rounded-md border border-hairline bg-canvas pl-9 pr-3 text-sm text-content outline-none placeholder:text-content-ash focus:border-signal-blue/60 focus:ring-1 focus:ring-signal-blue/30" />
              </label>
              <div className="flex min-w-0 gap-1 overflow-x-auto pb-1 lg:pb-0">
                <button type="button" onClick={() => setCategory('all')} className={`inline-flex h-11 items-center whitespace-nowrap rounded-md px-3 text-[11px] transition ${category === 'all' ? 'bg-content text-canvas' : 'text-content-muted hover:bg-white/[0.04] hover:text-content'}`}>All</button>
                {catalog?.categories.map((item) => <button key={item.id} type="button" onClick={() => setCategory(item.id)} className={`inline-flex h-11 items-center whitespace-nowrap rounded-md px-3 text-[11px] transition ${category === item.id ? 'bg-content text-canvas' : 'text-content-muted hover:bg-white/[0.04] hover:text-content'}`}>{item.label}</button>)}
              </div>
              <div className="grid shrink-0 grid-cols-2 gap-2 lg:flex">
                <label>
                  <span className="sr-only">Filter by provider</span>
                  <select value={provider} onChange={(event) => setProvider(event.target.value)} className="h-11 w-full rounded-md border border-hairline bg-canvas px-3 text-[11px] text-content outline-none focus:border-signal-blue/60 focus:ring-1 focus:ring-signal-blue/30 lg:w-36">
                    <option value="all">All providers</option>
                    {catalog?.providers.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  <span className="sr-only">Filter by service status</span>
                  <select value={status} onChange={(event) => {
                    const nextStatus = event.target.value
                    setStatus(nextStatus)
                    if (nextStatus === 'deprecated') setShowLegacy(true)
                  }} className="h-11 w-full rounded-md border border-hairline bg-canvas px-3 text-[11px] text-content outline-none focus:border-signal-blue/60 focus:ring-1 focus:ring-signal-blue/30 lg:w-32">
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="preview">Preview</option>
                    <option value="deprecated">Legacy</option>
                  </select>
                </label>
              </div>
              <label className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-md px-2 text-[11px] text-content-muted hover:bg-white/[0.04]"><input type="checkbox" checked={showLegacy} onChange={(event) => {
                const checked = event.target.checked
                setShowLegacy(checked)
                if (!checked && status === 'deprecated') setStatus('all')
              }} className="rounded border-hairline bg-canvas text-signal-blue focus:ring-signal-blue/30" />Show legacy</label>
            </div>
          </div>

          <div className="mt-4">
            {!catalog && !loadError && <CatalogSkeleton />}
            {loadError && (
              <div className="rounded-lg border border-signal-red/25 bg-signal-red/[0.06] px-5 py-8 text-center"><p className="text-sm text-content">{loadError}</p><p className="mt-2 text-xs text-content-muted">We do not show cached or guessed prices when the billing catalog is unavailable.</p>{lastAttempt && <p className="mt-1 text-[11px] text-content-ash">Last attempted {lastAttempt.toLocaleString('en-US')}</p>}<button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-4 h-11 rounded-md border border-hairline px-4 text-xs text-content hover:border-hairline-strong">Try again</button></div>
            )}
            {catalog && (
              <div className="overflow-hidden rounded-lg border border-hairline bg-surface/40">
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(118px,.85fr)_24px] gap-3 border-b border-hairline bg-white/[0.025] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-content-ash sm:grid-cols-[minmax(0,1.35fr)_minmax(100px,.65fr)_minmax(190px,1fr)_32px] sm:gap-4 sm:px-5"><span>Service</span><span className="hidden sm:block">Provider</span><span>Price</span><span /></div>
                {filteredOfferings.map((offering) => <PricingRow key={offering.id} offering={offering} catalog={catalog} expanded={expandedId === offering.id} onToggle={() => setExpandedId((current) => current === offering.id ? null : offering.id)} />)}
                {filteredOfferings.length === 0 && <div className="px-5 py-12 text-center text-sm text-content-muted">No services match these filters.</div>}
              </div>
            )}
            {catalog && <p className="mt-3 text-[11px] text-content-ash">{NUMBER.format(filteredOfferings.length)} of {NUMBER.format(catalog.offerings.length)} visible offerings · Catalog {catalog.catalogVersion.slice(0, 16)}…</p>}
          </div>
        </section>

        {catalog && (
          <section className="border-t border-hairline bg-surface/30">
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
              <div className="max-w-2xl"><div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-signal-blue">Cloud point policy</div><h2 className="mt-3 text-2xl font-semibold text-content">How Cloud points work</h2><p className="mt-3 text-sm leading-6 text-content-muted">The allowance and spending rules below are part of the live billing catalog, alongside every model formula.</p></div>
              <div className="mt-8 grid overflow-hidden rounded-lg border border-hairline bg-surface/50 sm:grid-cols-2 lg:grid-cols-4">
                <div className="border-b border-hairline p-5 sm:border-r lg:border-b-0"><div className="text-2xl font-semibold text-content">{NUMBER.format(catalog.cloudPolicy.cloudPlanAllowancePoints)}</div><p className="mt-2 text-xs leading-5 text-content-muted">Cloud Plan points are added for each monthly allowance period.</p></div>
                <div className="border-b border-hairline p-5 lg:border-b-0 lg:border-r"><div className="text-sm font-medium text-content">Monthly reset</div><p className="mt-2 text-xs leading-5 text-content-muted">Unused subscription allowance does not roll over and expires when the allowance resets.</p></div>
                <div className="border-b border-hairline p-5 sm:border-b-0 sm:border-r"><div className="text-sm font-medium text-content">Subscription first</div><p className="mt-2 text-xs leading-5 text-content-muted">Charges spend the subscription allowance before using purchased top-up points.</p></div>
                <div className="p-5"><div className="text-sm font-medium text-content">Top-ups stay available</div><p className="mt-2 text-xs leading-5 text-content-muted">Purchased top-up points do not expire, but points cannot be transferred or redeemed for cash.</p></div>
              </div>
            </div>
          </section>
        )}

        <section className="border-t border-hairline bg-surface/50">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8 lg:py-20">
            <div><div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-signal-blue">How billing works</div><h2 className="mt-3 text-2xl font-semibold text-content">Clear formulas. Exact settlement.</h2><p className="mt-4 text-sm leading-6 text-content-muted">The ledger stores the exact formula, measured usage, and catalog version used for every settled charge.</p></div>
            <div className="divide-y divide-hairline border-y border-hairline">
              {[['01', 'Measure usage', 'The provider reports tokens, generated units, duration, or actual cost.'], ['02', 'Evaluate once', 'Provider quanta are applied first. All formula components are then summed at full precision.'], ['03', 'Settle points', 'The final total is rounded once to the nearest point and written with an immutable billing snapshot.']].map(([number, title, text]) => <div key={number} className="grid grid-cols-[36px_1fr] gap-4 py-5"><span className="text-xs text-content-ash">{number}</span><div><h3 className="text-sm font-medium text-content">{title}</h3><p className="mt-1 text-xs leading-5 text-content-muted">{text}</p></div></div>)}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="text-center"><div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-content-ash">FAQ</div><h2 className="mt-3 text-2xl font-semibold text-content">Charges, failures, and corrections</h2></div>
          <div className="mx-auto mt-8 max-w-3xl divide-y divide-hairline border-y border-hairline">
            {[
              ['When are points charged?', 'Successful synchronous requests settle from their measured usage. Asynchronous jobs settle when a billable result is completed. Duplicate delivery is deduplicated before changing the balance.'],
              ['What happens when a request fails?', 'A request that fails before producing a billable provider outcome is not charged. If a provider confirms partial usage from an interrupted stream, that measured partial usage may be charged.'],
              ['Why can the final charge vary between requests?', 'Each response can contain different token counts, duration, generated units, cache usage, or provider-reported costs. The final one-time point rounding is applied only after every component is known.'],
              ['How are refunds or billing corrections handled?', 'Corrections are recorded as linked reversal entries so the original charge and its pricing snapshot remain auditable. Contact support if a settled charge does not match the service result.'],
              ['Do top-up points expire?', catalog ? `Purchased top-up points do not expire until used. The ${NUMBER.format(catalog.cloudPolicy.cloudPlanAllowancePoints)}-point Cloud Plan allowance resets monthly and unused allowance does not roll over.` : 'Point policy is shown only when the live billing catalog is available.'],
            ].map(([question, answer]) => <details key={question} className="group py-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-content"><span>{question}</span><span className="text-content-ash transition group-open:rotate-45">+</span></summary><p className="max-w-2xl pt-3 text-xs leading-6 text-content-muted">{answer}</p></details>)}
          </div>
        </section>

        <section className="border-t border-hairline">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 py-12 sm:flex-row sm:items-center sm:px-6 lg:px-8"><div><h2 className="text-xl font-semibold text-content">Ready to use Enconvo Cloud?</h2><p className="mt-2 text-sm text-content-muted">Choose a recurring plan or add points to an existing account.</p></div><div className="flex gap-3"><Link href="/pricing" className="inline-flex h-11 items-center rounded-md bg-content px-4 text-sm font-semibold text-canvas hover:bg-white">Compare plans</Link><Link href="/cloud-points" className="inline-flex h-11 items-center rounded-md border border-hairline px-4 text-sm text-content hover:border-hairline-strong">Top up points</Link></div></div>
        </section>
      </main>
    </div>
  )
}
