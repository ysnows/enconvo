import { useState } from 'react'
import Link from 'next/link'
import { Gift } from 'lucide-react'
import { primaryButton, secondaryButton } from '@/components/landing-styles'
import { formatCents, SUPPORT_EMAIL, type ProgramTerms } from '@/lib/affiliate-program'
import { card, fieldLabel } from './ui'

// The marketing half of /affiliate: what the program pays, how it works and the FAQ.
// Every number comes from the Worker's program terms; the example uses real list prices.

const PREMIUM_LICENSE = 9900
const PLUS_CLOUD_MONTHLY = 1000

export function AffiliateHero({ terms }: { terms: ProgramTerms }) {
    const share = (amount: number) => Math.round((amount * terms.commission_rate) / 100)
    const example = [
        { what: `A reader buys a Premium license for ${formatCents(PREMIUM_LICENSE, { cents: false })}`, earn: share(PREMIUM_LICENSE) },
        { what: `Another subscribes to Plus Cloud at ${formatCents(PLUS_CLOUD_MONTHLY, { cents: false })}/month`, earn: share(PLUS_CLOUD_MONTHLY) },
        { what: 'Their next 11 monthly renewals', earn: share(PLUS_CLOUD_MONTHLY) * 11 },
    ]
    const total = example.reduce((sum, row) => sum + row.earn, 0)

    return (
        <header className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-16">
            <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-card px-3 py-1 text-xs font-medium text-content-body">
                    <Gift className="h-3.5 w-3.5 text-signal-green" aria-hidden="true" />
                    Enconvo Affiliate program
                </span>
                <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight text-content sm:text-5xl sm:leading-[1.1]">
                    Earn {terms.commission_rate}% of what your referrals pay. Renewals included.
                </h1>
                <p className="mt-5 max-w-xl text-lg leading-8 text-content-body">
                    Share Enconvo with people who want an AI assistant on their computer. When someone buys through your
                    link, you earn {terms.commission_rate}% of every payment they make, for as long as they keep paying.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <a href="#apply" className={primaryButton}>
                        Apply now
                    </a>
                    <a href="#terms" className={secondaryButton}>
                        How payouts work
                    </a>
                </div>
            </div>

            <div className={`${card} p-6`}>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-content-muted">Example</p>
                <dl className="mt-4 divide-y divide-hairline text-sm">
                    {example.map((row) => (
                        <div key={row.what} className="flex items-baseline justify-between gap-4 py-3">
                            <dt className="text-content-body">{row.what}</dt>
                            <dd className="flex-none font-semibold text-signal-green">+{formatCents(row.earn)}</dd>
                        </div>
                    ))}
                </dl>
                <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-hairline-strong pt-4">
                    <span className="text-sm text-content-muted">Your first year from these two</span>
                    <span className="text-2xl font-semibold text-content">{formatCents(total)}</span>
                </div>
                <p className="mt-4 text-xs leading-5 text-content-ash">
                    List prices before tax. With a discount, you earn {terms.commission_rate}% of what the customer actually paid.
                </p>
            </div>
        </header>
    )
}

export function TermsCards({ terms }: { terms: ProgramTerms }) {
    const minimum = formatCents(terms.minimum_payout, { cents: false })
    const items = [
        {
            big: `${terms.commission_rate}%`,
            title: 'Of every payment',
            body: 'What the customer paid after discounts, before tax. Renewals and upgrades too.',
        },
        {
            big: `${terms.cookie_days} days`,
            title: 'To make up their mind',
            body: `Someone who opens your link and buys within ${terms.cookie_days} days on that browser is yours.`,
        },
        {
            big: `${terms.hold_days} days`,
            title: 'Refund window first',
            body: `A commission becomes payable ${terms.hold_days} days after the payment. Refunds take it back.`,
        },
        {
            big: 'Monthly',
            title: 'PayPal or Wise',
            body: `Paid in USD once your payable balance reaches ${minimum}. Smaller balances carry over.`,
        },
    ]
    return (
        <section id="terms" className="scroll-mt-28 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
                <div key={item.title} className={`${card} p-6`}>
                    <div className="text-3xl font-semibold text-content">{item.big}</div>
                    <div className="mt-2 font-medium text-content">{item.title}</div>
                    <p className="mt-2 text-sm leading-6 text-content-muted">{item.body}</p>
                </div>
            ))}
        </section>
    )
}

// What one customer pays each time on the pricing section, in cents. The Cloud plans renew monthly.
const CALCULATOR_PLANS = [
    { key: 'plus', label: 'Plus Cloud', price: PLUS_CLOUD_MONTHLY, unit: '/mo', renews: true },
    { key: 'pro', label: 'Pro Cloud', price: 5000, unit: '/mo', renews: true },
    { key: 'max', label: 'Max Cloud', price: 10000, unit: '/mo', renews: true },
    { key: 'premium', label: 'Premium', price: PREMIUM_LICENSE, unit: ' once', renews: false },
] as const
type CalculatorPlan = (typeof CALCULATOR_PLANS)[number]['key']

/**
 * The earnings calculator affiliate program pages offer: a plan and how many people buy it
 * through the link each month give what the link earns a month after a year, and in that year.
 */
export function EarningsCalculator({ terms }: { terms: ProgramTerms }) {
    const [planKey, setPlanKey] = useState<CalculatorPlan>('plus')
    const [customers, setCustomers] = useState(5)
    const plan = CALCULATOR_PLANS.find((item) => item.key === planKey) ?? CALCULATOR_PLANS[0]
    const perPayment = Math.round((plan.price * terms.commission_rate) / 100)
    // Each month's new subscribers keep paying, so month 12 collects from twelve months of them and
    // the first year from 1 + 2 + … + 12 = 78 months' worth. A license pays once.
    const monthly = perPayment * customers * (plan.renews ? 12 : 1)
    const firstYear = perPayment * customers * (plan.renews ? 78 : 12)
    const money = (amount: number) => formatCents(amount, { cents: false })

    return (
        <section id="earnings" className="scroll-mt-28">
            <h2 className="text-2xl font-semibold text-content">What you could earn</h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-7 text-content-muted">
                Pick what your audience buys and how many of them buy through your link each month.
            </p>
            <div className={`mt-6 grid gap-8 ${card} p-6 lg:grid-cols-2 lg:gap-12 lg:p-8`}>
                <div className="space-y-6">
                    <div>
                        <span className={fieldLabel} id="calculator-plan">
                            Plan they choose
                        </span>
                        <div
                            role="radiogroup"
                            aria-labelledby="calculator-plan"
                            className="mt-3 grid grid-cols-2 gap-1 rounded-xl border border-hairline bg-[#0B0C0D] p-1 sm:grid-cols-4"
                        >
                            {CALCULATOR_PLANS.map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    role="radio"
                                    aria-checked={planKey === item.key}
                                    onClick={() => setPlanKey(item.key)}
                                    className={`flex min-h-[52px] flex-col items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors ${planKey === item.key ? 'bg-content text-canvas' : 'text-content-body hover:text-content'}`}
                                >
                                    {item.label}
                                    <span className={`text-xs font-normal ${planKey === item.key ? 'text-canvas/70' : 'text-content-muted'}`}>
                                        {money(item.price)}
                                        {item.unit}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <label className="block">
                        <span className="flex items-baseline justify-between gap-4">
                            <span className={fieldLabel}>New customers each month</span>
                            <span className="text-lg font-semibold tabular-nums text-content">{customers}</span>
                        </span>
                        <input
                            type="range"
                            min={1}
                            max={50}
                            step={1}
                            value={customers}
                            onChange={(event) => setCustomers(Number(event.target.value))}
                            aria-valuetext={`${customers} new customers each month`}
                            className="mt-3 w-full accent-signal-green"
                        />
                        <span className="mt-1 flex justify-between text-xs text-content-ash" aria-hidden="true">
                            <span>1</span>
                            <span>50</span>
                        </span>
                    </label>
                </div>

                <div className="flex flex-col justify-center" aria-live="polite">
                    <dl className="grid gap-6 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm text-content-muted">{plan.renews ? 'A month, after a year' : 'A month'}</dt>
                            <dd className="mt-1 text-4xl font-semibold tabular-nums text-signal-green">{money(monthly)}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-content-muted">In your first year</dt>
                            <dd className="mt-1 text-4xl font-semibold tabular-nums text-content">{money(firstYear)}</dd>
                        </div>
                    </dl>
                    <p className="mt-5 text-sm leading-6 text-content-body">
                        {plan.renews
                            ? `${(customers * 12).toLocaleString('en-US')} subscribers by then, each earning you ${formatCents(perPayment)} a month.`
                            : `${formatCents(perPayment)} from each license, paid once.`}
                    </p>
                    <p className="mt-3 text-xs leading-5 text-content-ash">
                        An estimate at list prices before tax that assumes every subscriber keeps paying; cancellations lower
                        it. With a discount you earn {terms.commission_rate}% of what the customer actually paid, and a
                        yearly plan earns {terms.commission_rate}% of the yearly price each time it is paid.
                    </p>
                </div>
            </div>
        </section>
    )
}

export function HowItWorks() {
    const steps = [
        { title: 'Apply', body: "Tell us who you reach and how you'd share Enconvo. We read every application ourselves." },
        {
            title: 'Share your link',
            body: 'Once approved you get enconvo.com/?via=yourcode, plus images and ready-made text. Use them in posts, videos, newsletters and reviews.',
        },
        { title: 'Watch it add up', body: 'Your dashboard shows visitors, sign-ups, customers and every commission as it happens.' },
    ]
    return (
        <section>
            <h2 className="text-2xl font-semibold text-content">How it works</h2>
            <ol className="mt-6 grid gap-4 md:grid-cols-3">
                {steps.map((step, index) => (
                    <li key={step.title} className={`flex gap-4 ${card} p-6`}>
                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-content text-sm font-semibold text-canvas">
                            {index + 1}
                        </span>
                        <div>
                            <div className="font-medium text-content">{step.title}</div>
                            <p className="mt-1 text-sm leading-6 text-content-muted">{step.body}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </section>
    )
}

export function AffiliateFaq({ terms }: { terms: ProgramTerms }) {
    const minimum = formatCents(terms.minimum_payout, { cents: false })
    const faqs = [
        {
            q: 'What counts as a referral?',
            a: `Anyone who opens your link and pays on enconvo.com within ${terms.cookie_days} days, on the same browser. Licenses, extra seats, Cloud plans and their renewals, and Cloud points packs all earn a commission, and the customer stays yours for their later purchases. If they buy through another Affiliate's link, the newest link wins.`,
        },
        {
            q: 'When do I get paid?',
            a: `A commission becomes payable ${terms.hold_days} days after the payment. Early each month we pay every payable balance of ${minimum} or more by PayPal or Wise, in USD. Smaller balances carry over to the next month.`,
        },
        {
            q: 'What happens when a customer gets a refund or disputes a charge?',
            a: 'The commission on that payment is taken back. A dispute that we win gives it back. If it was already paid out, it comes off your next payout.',
        },
        {
            q: 'Can I see who I referred?',
            a: 'Yes. Your dashboard lists each referral with a masked email such as j***@gmail.com, when they joined, their plan, what they paid and your commission.',
        },
        {
            q: 'Can I buy Enconvo through my own link?',
            a: "You can, but your own purchases don't earn a commission. We review purchases that look like your own, such as one made with another of your email addresses or your payout email, or from a browser you're signed in on. If it's a self-referral, we void its commission.",
        },
        {
            q: 'Do I need an Enconvo license to apply?',
            a: 'No. You need a free Enconvo account, so your dashboard and payouts have somewhere to live.',
        },
    ]
    return (
        <section>
            <h2 className="text-2xl font-semibold text-content">Questions</h2>
            <div className="mt-4 divide-y divide-hairline border-y border-hairline">
                {faqs.map((faq, index) => (
                    <details key={faq.q} className="group" open={index === 0}>
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-base font-medium text-content [&::-webkit-details-marker]:hidden">
                            {faq.q}
                            <span className="text-xl leading-none text-content-muted transition-transform group-open:rotate-45" aria-hidden="true">
                                +
                            </span>
                        </summary>
                        <p className="-mt-1 max-w-3xl pb-5 text-[15px] leading-7 text-content-body">{faq.a}</p>
                    </details>
                ))}
            </div>
            <p className="mt-6 text-sm text-content-muted">
                The full rules are in the{' '}
                <Link href="/affiliate/terms" className="text-signal-blue hover:underline">
                    Affiliate program terms
                </Link>
                . Anything else? Email{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-signal-blue hover:underline">
                    {SUPPORT_EMAIL}
                </a>
                .
            </p>
        </section>
    )
}
