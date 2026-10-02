import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Footer } from '@/components/Footer'
import { metaLabel } from '@/components/landing-styles'
import { SiteNav } from '@/components/SiteNav'
import { DEFAULT_TERMS, fetchProgramTerms, formatCents, SUPPORT_EMAIL, type ProgramTerms } from '@/lib/affiliate-program'

// The Affiliate program terms that /affiliate links to and every applicant accepts.
// Numbers come from the Worker's program terms so the page never drifts from the ledger.

const LAST_UPDATED = 'October 2, 2026'

function sections(terms: ProgramTerms) {
    const minimum = formatCents(terms.minimum_payout, { cents: false })
    return [
        {
            title: 'Joining',
            body: [
                'You apply with an Enconvo account on enconvo.com/affiliate. We review every application and may approve or decline it at our discretion.',
                'Once approved you get a personal link, enconvo.com/?via=yourcode, that works on any enconvo.com page. Your dashboard, balance and payouts belong to the account you applied with.',
            ],
        },
        {
            title: 'What you earn',
            body: [
                `You earn ${terms.commission_rate}% of each payment made on enconvo.com by a customer you referred, unless we agreed a different rate with you; your dashboard shows your rate. This covers licenses, extra seats, Cloud plans and their renewals and upgrades, and Cloud points packs.`,
                'The commission is calculated on what the customer actually paid, after discounts and before taxes. Payments in currencies other than US dollars, purchases made outside enconvo.com and gifts or credits we hand out do not earn a commission.',
                'A rate change applies to payments made after the change. Commissions already recorded keep the rate they were recorded at.',
            ],
        },
        {
            title: 'Who counts as your referral',
            body: [
                `A visitor becomes your referral when they open your link and then pay within ${terms.cookie_days} days on the same browser. If they open another Affiliate's link before paying, the most recent link gets the referral.`,
                `Someone who signs up or signs in to Enconvo after opening your link also stays your referral for ${terms.cookie_days} days from their latest sign-up or sign-in through it, so a purchase in the app or on another device still counts, unless they come through another Affiliate's link in between. Your dashboard shows until when each sign-up can still earn you commission.`,
                'Renewals and upgrades of a plan bought through your link stay yours for as long as the customer keeps paying.',
                'Tracking relies on a first-party cookie. Visits from search engines, crawlers and other automated tools are not counted, so your visitor count can be lower than a click counter of your own. Purchases we cannot connect to your link, for example by a visitor who never signed in and then clears their browser data or switches devices, are not credited, and we cannot add them by hand.',
            ],
        },
        {
            title: 'Refunds and holds',
            body: [
                `Each commission is held for ${terms.hold_days} days after the payment, which covers our refund window. After that it becomes payable.`,
                'If a payment is refunded, its commission is reversed in proportion to the refunded amount. If the customer disputes a payment with their bank, its commission is reversed while the dispute is open and restored if the dispute is decided in our favor. A reversal of a commission that was already paid is subtracted from your next payouts.',
            ],
        },
        {
            title: 'Payouts',
            body: [
                `Early each month we pay every payable balance of ${minimum} or more, in US dollars, by PayPal or Wise to the account you saved in your dashboard. Smaller balances carry over to the next month.`,
                'You are responsible for the account details being correct, for any fees your payment provider charges you, and for declaring and paying any taxes on your earnings. We may ask for the information we need to make or report payments before paying.',
                'To protect your earnings, if you change your payout account after a payout, we may confirm the change with you before sending the next payout to the new account.',
            ],
        },
        {
            title: 'Promoting Enconvo',
            body: [
                'Describe Enconvo honestly. Do not invent features, prices, discounts or deadlines, and make clear that you earn a commission when you recommend it, as the laws where you and your audience live may require.',
                "You may not send spam or unsolicited messages, bid on search ads for \"Enconvo\" or close variants, run ads or sites that impersonate Enconvo, use misleading coupon or deal sites, use cookie stuffing, forced clicks or hidden links, or buy through your own link. Your own purchases never earn a commission.",
                'You may use the Enconvo name and logo only to refer to Enconvo, without changing them or implying that Enconvo endorses you.',
            ],
        },
        {
            title: 'Pausing and ending',
            body: [
                "We may pause your link or close your Affiliate account if you break these terms or if we see fraud or abuse. We review referrals that look like your own purchases. Commissions from referrals that broke these terms are voided: they are not paid, any already paid come off your next payout, and the referral's renewals earn nothing. While your link is paused, new payments do not earn a commission.",
                'You can leave the program at any time by emailing us. Unless your account was closed for breaking these terms, we pay your remaining payable balance once it reaches the minimum.',
                'We may change or end the program. Changes take effect when we publish them on this page; commissions already recorded are paid under the terms in place when they were earned. If we end the program we will pay every balance that becomes payable, regardless of the minimum.',
            ],
        },
        {
            title: 'Everything else',
            body: [
                'You are an independent partner, not an employee, agent or representative of Enconvo. The Enconvo terms of use and privacy policy also apply.',
                'Customer data shown in your dashboard is masked. Do not try to identify, contact or market to customers through it.',
            ],
        },
    ]
}

export default function AffiliateTermsPage() {
    const [terms, setTerms] = useState<ProgramTerms>(DEFAULT_TERMS)
    useEffect(() => {
        let cancelled = false
        void fetchProgramTerms().then((result) => {
            if (!cancelled && result.ok) setTerms(result.data)
        })
        return () => {
            cancelled = true
        }
    }, [])

    return (
        <>
            <Head>
                <title>Affiliate program terms - Enconvo</title>
                <meta name="description" content="The rules of the Enconvo Affiliate program: commissions, attribution, refunds, payouts and promotion." />
                <link rel="canonical" href="https://enconvo.com/affiliate/terms" />
            </Head>
            <div className="min-h-screen bg-canvas text-content">
                <SiteNav />
                <main className="mx-auto max-w-3xl px-6 pb-24 pt-36">
                    <p className={metaLabel}>Affiliate program</p>
                    <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl sm:leading-[1.1]">Affiliate program terms</h1>
                    <p className="mt-5 text-base leading-7 text-content-body">
                        These terms apply to everyone in the Enconvo Affiliate program. By applying you agree to them. Last updated{' '}
                        {LAST_UPDATED}.
                    </p>
                    <div className="mt-12 space-y-12">
                        {sections(terms).map((section, index) => (
                            <section key={section.title}>
                                <h2 className="text-xl font-semibold text-content">
                                    <span className="mr-3 text-content-ash">{index + 1}.</span>
                                    {section.title}
                                </h2>
                                <div className="mt-4 space-y-4 text-[15px] leading-7 text-content-body">
                                    {section.body.map((paragraph) => (
                                        <p key={paragraph}>{paragraph}</p>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                    <div className="mt-16 flex flex-wrap gap-x-6 gap-y-2 border-t border-hairline pt-6 text-sm text-content-muted">
                        <Link href="/affiliate" className="text-signal-blue hover:underline">
                            Back to the Affiliate program
                        </Link>
                        <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-content">
                            {SUPPORT_EMAIL}
                        </a>
                    </div>
                </main>
                <Footer />
            </div>
        </>
    )
}
