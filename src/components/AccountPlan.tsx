import Link from 'next/link'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ArrowRight, Cloud, Crown, Gem, Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/I18nProvider'
import {
  FREE_ENTITLEMENTS,
  type AccountPlan as Plan,
  type Entitlements,
} from '@/lib/account-plan'

// The Account page's plan sections, the website's copy of the Enconvo app's
// Account settings (modules/enconvo_webapp NativeSettingsPanes.tsx): a
// Lifetime License section and an Enconvo Cloud section, each showing its rows
// when the account holds it or a button to get it, then Usage and billing.

type Translate = ReturnType<typeof useI18n>['t']
type Row = { label: string; value: string; muted?: boolean }

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

// The next time `anchor`'s day of the month comes round, clamped to the month's
// length, as the yearly plans' monthly points reset does.
function nextMonthlyAnniversary(anchor: Date) {
  const day = anchor.getDate()
  const now = new Date()
  let year = now.getFullYear()
  let month = now.getMonth()
  let next = new Date(year, month, Math.min(day, daysInMonth(year, month)))
  if (next.getTime() <= now.getTime()) {
    month += 1
    if (month > 11) {
      month = 0
      year += 1
    }
    next = new Date(year, month, Math.min(day, daysInMonth(year, month)))
  }
  return next
}

function validDate(value: string | null) {
  const date = value ? new Date(value) : null
  return date && !isNaN(date.getTime()) ? date : null
}

// The device count sits in the Cloud section when a Cloud plan is active (it
// gives the most devices), otherwise in the Lifetime License section.
function licenseRows(
  ent: Entitlements,
  devices: Row,
  t: Translate,
  formatDate: (date: Date) => string
): Row[] | null {
  if (ent.license.tier === 'none') return null
  const since = validDate(ent.license.since)
  const teams = ent.license.tier === 'teams'
  const rows: Row[] = [
    {
      label: t('Tier'),
      value: teams ? 'Teams' : ent.license.tier === 'premium' ? 'Pro' : 'Plus',
    },
  ]
  if (since) rows.push({ label: t('Purchased'), value: formatDate(since) })
  rows.push({ label: t('Access'), value: t('Lifetime · never expires') })
  if (teams) {
    rows.push({
      label: t('Seats'),
      value: String(ent.license.seats || ent.deviceLimit),
    })
  }
  if (ent.license.tier === 'premium' || teams) {
    rows.push({ label: t('Updates & support'), value: t('For life') })
  } else if (since) {
    const updatesEnd = new Date(since)
    updatesEnd.setFullYear(updatesEnd.getFullYear() + 1)
    rows.push({
      label: t('Updates & support'),
      value: `${formatDate(since)} – ${formatDate(updatesEnd)}`,
      muted: updatesEnd.getTime() < Date.now(),
    })
  }
  if (!ent.cloud.active) rows.push(devices)
  return rows
}

function cloudRows(
  ent: Entitlements,
  devices: Row,
  t: Translate,
  formatDate: (date: Date) => string
): Row[] | null {
  if (!ent.cloud.active) return null
  const end = validDate(ent.cloud.endTime)
  const yearly = ent.cloud.plan === 'yearly'
  const rows: Row[] = [
    {
      label: t('Tier'),
      value:
        ent.cloud.tier === 'pro'
          ? 'Pro'
          : ent.cloud.tier === 'max'
            ? 'Max'
            : 'Plus',
    },
    { label: t('Billing'), value: yearly ? t('Yearly') : t('Monthly') },
  ]
  if (ent.cloud.cancelAtPeriodEnd) {
    // Cancelled: no more billing, so show when the plan ends instead.
    rows.push({
      label: t('Ends'),
      value: end
        ? t('{date} · won’t renew', { date: formatDate(end) })
        : t('At period end'),
      muted: true,
    })
    // A cancelled yearly plan still resets its points monthly until it ends.
    if (end && yearly) {
      rows.push({
        label: t('Points reset'),
        value: formatDate(nextMonthlyAnniversary(end)),
      })
    }
  } else if (end) {
    rows.push({ label: t('Next billing'), value: formatDate(end) })
    rows.push({
      label: t('Points reset'),
      value: formatDate(yearly ? nextMonthlyAnniversary(end) : end),
    })
  }
  rows.push(devices)
  return rows
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-4 text-xl font-semibold">{title}</h3>
      <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-white/[0.025]">
        {children}
      </div>
    </section>
  )
}

function SectionRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[3.25rem] items-center justify-between gap-4 px-4 py-3">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex flex-wrap items-center justify-end gap-2 text-right text-sm">
        {children}
      </div>
    </div>
  )
}

function PlanRows({ rows }: { rows: Row[] }) {
  return (
    <>
      {rows.map((row) => (
        <SectionRow key={row.label} label={row.label}>
          <span className={row.muted ? 'text-gray-500' : 'text-gray-100'}>
            {row.value}
          </span>
        </SectionRow>
      ))}
    </>
  )
}

const GET_BUTTON =
  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors'
const OUTLINE_BUTTON =
  'inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:bg-white/10'

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden="true">
      {[3, 2, 1].map((rows) => (
        <div key={rows}>
          <div className="mb-4 h-6 w-40 rounded bg-gray-800" />
          <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-white/[0.025]">
            {Array.from({ length: rows }, (_, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-4"
              >
                <div className="h-4 w-24 rounded bg-gray-800" />
                <div className="h-4 w-32 rounded bg-gray-800" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AccountPlan({ accessToken }: { accessToken: string }) {
  const { t, locale } = useI18n()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [failed, setFailed] = useState(false)
  const [billing, setBilling] = useState<'idle' | 'opening' | 'none' | 'error'>(
    'idle'
  )

  const load = useCallback(async () => {
    setFailed(false)
    try {
      const response = await fetch('/api/account/plan', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setPlan(await response.json())
    } catch (error) {
      console.error('Error fetching plan:', error)
      setFailed(true)
    }
  }, [accessToken])

  useEffect(() => {
    void load()
  }, [load])

  // Coming back from Stripe through the back button restores the page as it
  // was left, spinner included.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setBilling('idle')
    }
    window.addEventListener('pageshow', reset)
    return () => window.removeEventListener('pageshow', reset)
  }, [])

  const openBilling = async () => {
    setBilling('opening')
    try {
      const response = await fetch('/api/subscription/billing_portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ locale }),
      })
      const data = await response.json().catch(() => null)
      if (data?.url) {
        window.location.href = data.url
        return
      }
      setBilling(data?.reason === 'no_customer' ? 'none' : 'error')
    } catch (error) {
      console.error('Error opening billing:', error)
      setBilling('error')
    }
  }

  if (failed) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-red-400" role="status">
          {t('Plan details are temporarily unavailable.')}
        </span>
        <button
          onClick={() => void load()}
          className="rounded-md bg-gray-800 px-3 py-1 text-sm text-gray-200 transition-colors hover:bg-gray-700"
        >
          {t('Try again')}
        </button>
      </div>
    )
  }
  if (!plan) return <Skeleton />

  const ent = plan.entitlements ?? FREE_ENTITLEMENTS
  const formatDate = (date: Date) =>
    date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  // The website isn't a device, so the count can be missing; the limit isn't.
  const devices: Row =
    plan.devicesUsed === null
      ? {
          label: t('Devices'),
          value: t('Up to {count}', { count: ent.deviceLimit }),
        }
      : {
          label: t('Devices'),
          value: `${plan.devicesUsed} / ${ent.deviceLimit}`,
          muted: plan.devicesUsed > ent.deviceLimit,
        }
  const license = licenseRows(ent, devices, t, formatDate)
  const cloud = cloudRows(ent, devices, t, formatDate)
  const balance = new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(plan.total)

  return (
    <div className="space-y-6">
      <Section title={t('Lifetime License')}>
        {license ? (
          <PlanRows rows={license} />
        ) : (
          <SectionRow label={t('Plan')}>
            <Link
              href="/#pricing"
              className={`${GET_BUTTON} bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-600`}
            >
              <Crown className="h-4 w-4" aria-hidden="true" />
              {t('Get Lifetime')}
            </Link>
          </SectionRow>
        )}
      </Section>

      <Section title={t('Enconvo Cloud')}>
        {cloud ? (
          <>
            <PlanRows rows={cloud} />
            {ent.cloud.tier !== 'max' && (
              <SectionRow label={t('Upgrade')}>
                <Link href="/#pricing" className={OUTLINE_BUTTON}>
                  <Gem className="h-4 w-4" aria-hidden="true" />
                  {ent.cloud.tier === 'pro'
                    ? t('Upgrade to Max')
                    : t('Upgrade to Pro or Max')}
                </Link>
              </SectionRow>
            )}
          </>
        ) : (
          <SectionRow label={t('Plan')}>
            <Link
              href="/#pricing"
              className={`${GET_BUTTON} bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-500 hover:to-blue-600`}
            >
              <Cloud className="h-4 w-4" aria-hidden="true" />
              {t('Get Cloud plan')}
            </Link>
          </SectionRow>
        )}
        <SectionRow label={t('Model & service rates')}>
          <Link
            href="/cloud-pricing"
            className="inline-flex items-center gap-1 text-gray-400 transition-colors hover:text-white"
          >
            {t('View pricing')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </SectionRow>
      </Section>

      <Section title={t('Usage')}>
        <SectionRow label={t('Total balance')}>
          <span className="text-base font-semibold tabular-nums text-gray-100">
            {balance}
          </span>
          <Link href="/cloud-points" className={OUTLINE_BUTTON}>
            {t('Top Up')}
          </Link>
        </SectionRow>
      </Section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => void openBilling()}
          disabled={billing === 'opening'}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600 disabled:opacity-60"
        >
          {t('Manage billing')}
          {billing === 'opening' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
        {billing === 'none' && (
          <span className="text-sm text-gray-400" role="status">
            {t('There are no billing records for this account.')}
          </span>
        )}
        {billing === 'error' && (
          <span className="text-sm text-red-400" role="status">
            {t('Could not open billing. Please try again.')}
          </span>
        )}
      </div>
    </div>
  )
}
