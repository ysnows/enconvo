import { useI18n } from '@/i18n/I18nProvider'
import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import {
  formatCents,
  PAYOUT_METHOD_LABEL,
  type AffiliateDashboard,
} from '@/lib/affiliate-program'
import { card } from './ui'

// The first steps on /affiliate for a new Affiliate, with how far it got: accept the terms, add a
// payout method, bring a first visitor through the link, and a first customer. It goes away once
// the link has earned something.

interface Step {
  key: string
  title: string
  done: boolean
  detail: ReactNode
}

const ACTION = 'font-medium text-signal-blue hover:underline'

/** The steps, or null once the Affiliate has a customer or earned a commission. */
export function startSteps(
  data: AffiliateDashboard,
  termsAccepted: boolean,
  t: (source: string) => string = (source) => source
): Step[] | null {
  const affiliate = data.affiliate
  if (!affiliate) return null
  const totals = data.totals ?? { visitors: 0, signups: 0, customers: 0 }
  if (totals.customers > 0 || (data.balances?.earned ?? 0) > 0) return null
  const terms = data.program
  const method =
    affiliate.payout_method && affiliate.payout_account
      ? affiliate.payout_method
      : null
  return [
    {
      key: 'terms',
      title: 'Accept the program terms',
      done: termsAccepted,
      detail: termsAccepted
        ? 'Accepted.'
        : 'Read them and accept them above. We ask for this before we send a payout.',
    },
    {
      key: 'payout',
      title: 'Add a payout method',
      done: !!method,
      detail: method ? (
        `Payouts go to your ${
          PAYOUT_METHOD_LABEL[method]
        } account once ${formatCents(terms.minimum_payout, {
          cents: false,
        })} is payable.`
      ) : (
        <>
          {t('PayPal or Wise, so we can pay you.')}{' '}
          <a href="#payout" className={ACTION}>
            {t('Add payout method')}
          </a>
        </>
      ),
    },
    {
      key: 'share',
      title: 'Share your link',
      done: totals.visitors > 0,
      detail:
        totals.visitors > 0 ? (
          `${totals.visitors.toLocaleString('en-US')} ${
            totals.visitors === 1 ? 'person has' : 'people have'
          } opened it so far.`
        ) : (
          <>
            {t(
              'Post it where your audience already is. The promotion kit has images and ready-made posts with your link in them.'
            )}{' '}
            <a href="#affiliate-kit" className={ACTION}>
              {t('Open the kit')}
            </a>
          </>
        ),
    },
    {
      key: 'customer',
      title: 'Your first customer',
      done: false,
      detail: `Anyone who opens your link and pays within ${terms.cookie_days} days earns you ${affiliate.commission_rate}% of what they paid, renewals included.`,
    },
  ]
}

export function GettingStarted({
  data,
  termsAccepted,
}: {
  data: AffiliateDashboard
  termsAccepted: boolean
}) {
  const { t, locale } = useI18n()

  const steps = startSteps(data, termsAccepted, t)
  if (!steps) return null
  const done = steps.filter((step) => step.done).length
  return (
    <section className={`${card} p-6`} aria-labelledby="getting-started">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="getting-started" className="text-lg font-semibold text-content">
          {t('Get started')}
        </h2>
        <span className="text-xs text-content-muted">
          {done} {t(' of ')}
          {steps.length} {t(' done')}
        </span>
      </div>
      <div
        className="mt-3 h-1 overflow-hidden rounded-full bg-[#1F2224]"
        role="progressbar"
        aria-label={t('Steps done')}
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={done}
      >
        <div
          className="h-full rounded-full bg-signal-green"
          style={{ width: `${(done / steps.length) * 100}%` }}
        />
      </div>
      <ol className="mt-5 space-y-4">
        {steps.map((step, i) => (
          <li key={step.key} className="flex gap-3">
            <span
              className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border text-xs font-medium tabular-nums ${
                step.done
                  ? 'border-[#1F3A2D] bg-[#0D1A14] text-signal-green'
                  : 'border-hairline text-content-muted'
              }`}
              aria-hidden="true"
            >
              {step.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <div className="min-w-0">
              <p
                className={`text-sm font-medium ${
                  step.done ? 'text-content-muted' : 'text-content'
                }`}
              >
                {t(step.title)}
                <span className="sr-only">
                  {step.done ? t(' (done)') : t(' (to do)')}
                </span>
              </p>
              <p className="mt-0.5 text-sm leading-6 text-content-muted">
                {t(step.detail)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
