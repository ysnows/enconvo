import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import type { MouseEvent } from 'react'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { ArrowRightIcon, CheckIcon, CounterClockwiseClockIcon, Cross2Icon, DownloadIcon, LaptopIcon, LightningBoltIcon, LockClosedIcon, ReaderIcon, ReloadIcon, VideoIcon } from '@radix-ui/react-icons'
import { HeroShowcase } from '@/components/HeroShowcase'
import { HeroLayout } from '@/components/home/HeroLayout'
import { trackEvent } from '@/lib/analytics'
import { burstConfetti } from '@/lib/ltd-confetti'
import { getLtdReferral } from '@/lib/ltd-referral'
import { formatUsd, getLtdPlan, isLtdOfferEligible, LTD_OFFER, ltdLoginUrl, ltdPlans, ltdPriceCents, type LtdPlan, type LtdPlanKey } from '@/data/ltdOffer'
import styles from '@/styles/Ltd.module.css'
import homeStyles from '@/styles/Home.module.css'

const faqs = [
  ['What does lifetime mean?', 'All three plans are one-time app licenses with no recurring license fee. Standard includes one year of free updates. Premium and Teams include lifetime free updates.'],
  ['Is AI usage included?', 'Each plan includes a one-time Cloud points bonus. You can also connect your own AI API keys or use supported local models. AI provider charges and optional Cloud subscriptions are separate from the app license.'],
  ['How does Teams work?', 'This offer covers the five-device Teams license. The five Mac devices share one Enconvo account.'],
  ['What happens after payment?', 'Your license is linked to the Enconvo account used at checkout. Download Enconvo, sign in with that account, and start using your unlocked features.'],
  ['Can I get a refund?', 'Yes. Every license comes with a 30-day money-back guarantee. Request a refund in Enconvo under Settings → Account, or email support@enconvo.com.'],
]

// The free-plan limits a license removes (mirrors LICENSE_COMPARISON in Pricing.tsx).
const unlocks = [
  { Icon: ReaderIcon, title: 'Unlimited knowledge bases', free: 'Free plan: 1' },
  { Icon: LightningBoltIcon, title: 'Unlimited workflows', free: 'Free plan: 1' },
  { Icon: VideoIcon, title: 'Unlimited meeting recording', free: 'With live captions. Free plan: 1 session' },
  { Icon: DownloadIcon, title: 'Import and export your data', free: 'Not on the free plan' },
]

const finderOptions: { plan: LtdPlanKey; label: string; hint?: string }[] = [
  { plan: 'standard', label: 'Just 1 Mac', hint: 'Want lifetime updates too? Premium includes them.' },
  { plan: 'premium', label: '2–3 Macs' },
  { plan: 'teams', label: '4–5 Macs', hint: 'All five Macs share one Enconvo account.' },
]

const perks = [
  `${LTD_OFFER.discountPercent}% off every lifetime license`,
  'Pay once, no subscription',
  '30-day money-back guarantee',
  'Up to 250,000 bonus Cloud points',
  'Lifetime updates on Premium and Teams',
  'Bring your own API keys or local models',
  'Intel and Apple Silicon',
]

// Decorative confetti pieces resting around the ticket: [left %, top %, rotation, shape].
// Placed around the ticket, never behind its edges or across the hint line.
const sprinkles = [
  [-4, 14, -24, 'bar'], [14, -2, 18, 'dot'], [80, -5, 32, 'bar'], [101, 24, 0, 'ring'], [-6, 50, 0, 'ring'],
  [102, 60, -38, 'bar'], [-3, 82, 46, 'bar'], [100, 84, 0, 'dot'], [48, -7, 12, 'dot'],
] as const
// KenMoo green and gold, matching the offer page palette.
const confettiColors = ['#f5c518', '#ffd648', '#f0a000', '#1f8a5b', '#f4f4f6']

type LtdPageProps = { initialAffiliateCode: string | null }

// Render the correct community branding, prices, and sharing metadata on the
// first response, before the browser's router is ready.
export const getServerSideProps: GetServerSideProps<LtdPageProps> = async ({ query }) => ({
  props: { initialAffiliateCode: typeof query.via === 'string' ? query.via.slice(0, 200) : null },
})

function planPriceNote(plan: LtdPlan, affiliateCode: string | undefined) {
  return plan.deviceCount > 1 ? `one-time · ${formatUsd(Math.round(ltdPriceCents(plan, affiliateCode) / plan.deviceCount))} per Mac` : 'one-time payment'
}

// Crystal community campaign. Design variance 6, motion 5, density 4: the
// visitor claims a community ticket, finds the plan that fits their Macs, and
// follows a visible path to checkout. No timers or scarcity, only real terms.
export default function LtdPage({ initialAffiliateCode }: LtdPageProps) {
  const router = useRouter()
  const inFlight = useRef(false)
  const noticeRef = useRef<HTMLDivElement>(null)
  const [loadingPlan, setLoadingPlan] = useState<LtdPlanKey | null>(null)
  const [error, setError] = useState<{ plan: LtdPlanKey; message: string } | null>(null)
  const [claimed, setClaimed] = useState(false)
  const [fit, setFit] = useState<LtdPlanKey | null>(null)
  const selected = router.isReady ? getLtdPlan(router.query.plan) : undefined
  const canceled = router.isReady && router.query.canceled === 'true'
  const affiliateCode = router.isReady
    ? typeof router.query.via === 'string' ? router.query.via.slice(0, 200) : undefined
    : initialAffiliateCode || undefined
  const discounted = isLtdOfferEligible(affiliateCode)
  const percent = LTD_OFFER.discountPercent
  const offerPrices = ltdPlans.map(plan => formatUsd(ltdPriceCents(plan, 'kenmoo')))
  const title = discounted ? `Enconvo × KenMoo | ${percent}% Off Lifetime Licenses` : 'Enconvo Lifetime Licenses | Pay Once'
  const description = discounted
    ? `An exclusive offer for the KenMoo community. Get ${percent}% off Enconvo Standard, Premium, and Teams: ${offerPrices[0]}, ${offerPrices[1]}, and ${offerPrices[2]}. Pay once, with a 30-day money-back guarantee.`
    : 'Get Enconvo for Mac with a one-time Standard, Premium, or Teams license: $49, $99, and $139.'
  const pageUrl = `https://www.enconvo.com${LTD_OFFER.path}${discounted ? '?via=kenmoo' : ''}`
  const purchaseFaq = discounted
    ? ['How do I get the KenMoo discount?', `Choose a plan using this KenMoo community offer, sign in or create your Enconvo account, and continue to checkout. Your ${percent}% discount is applied automatically. No coupon code is needed.`]
    : ['How do I buy a lifetime license?', 'Choose a plan, sign in or create your Enconvo account, and continue to secure checkout. Your license is a one-time payment.']
  // Returning buyers already took the ticket and picked a plan.
  const ticketClaimed = claimed || Boolean(selected)
  const fitPlan = fit ? getLtdPlan(fit) : undefined
  const fitOption = finderOptions.find(option => option.plan === fit)
  const progress = selected || fitPlan ? 2 : 1
  const steps = [
    ['Discount unlocked', 'Through the KenMoo link'],
    ['Pick your plan', 'Match it to your Macs'],
    ['Sign in and pay', 'Secure Stripe checkout'],
    ['Activate on your Macs', 'Sign in to Enconvo'],
  ]

  // Buyers returning from sign-in or a canceled checkout land at the top of the
  // page; bring their selected plan and its continue action into view.
  useEffect(() => {
    if (selected) noticeRef.current?.scrollIntoView({ block: 'start' })
  }, [selected])

  function claimTicket(event: MouseEvent<HTMLButtonElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    burstConfetti({ x: box.left + box.width / 2, y: box.top + box.height / 3 }, confettiColors)
    setClaimed(true)
  }

  async function buy(plan: LtdPlan) {
    if (inFlight.current) return
    inFlight.current = true
    setLoadingPlan(plan.key)
    setError(null)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw new Error('Could not check your sign-in. Please try again.')
      const retainedReferral = typeof router.query.referral === 'string' ? router.query.referral : undefined
      const referral = await getLtdReferral(affiliateCode, 3000, retainedReferral)
      trackEvent('begin_checkout', { plan: plan.key, signed_in: Boolean(session) })
      if (!session) {
        await router.push(ltdLoginUrl(plan, affiliateCode, referral))
        return
      }

      const response = await fetch('/api/subscription/ltd_checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ lookupKey: plan.key, endorsely_referral: referral, via: affiliateCode }),
      })
      if (response.status === 401) {
        await router.push(ltdLoginUrl(plan, affiliateCode, referral))
        return
      }
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Checkout is temporarily unavailable. Please try again.')
      const destination = new URL(result.url)
      if (destination.protocol !== 'https:' || destination.hostname !== 'checkout.stripe.com') {
        throw new Error('Could not open checkout. Please try again.')
      }
      window.location.assign(destination.href)
    } catch (cause) {
      setError({ plan: plan.key, message: cause instanceof Error ? cause.message : 'Could not open checkout. Please try again.' })
    } finally {
      inFlight.current = false
      setLoadingPlan(null)
    }
  }

  return (
    <div className={`${styles.page} ${discounted ? styles.offerMode : ''} bg-canvas text-content`}>
      <HeroLayout />
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Enconvo" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="https://www.enconvo.com/og/enconvo-mac-agent-v1.jpg" />
        <meta property="og:image:alt" content="Enconvo AI assistant for Mac" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content="https://www.enconvo.com/og/enconvo-mac-agent-v1.jpg" />
      </Head>

      <a className={styles.skipLink} href="#plans">Skip to offers</a>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Enconvo home">
          <Image src="/logo.webp" alt="" width={32} height={32} priority />
          <span>Enconvo</span>
        </Link>
        <nav aria-label="Offer navigation">
          <a href="#unlocks">What you get</a>
          <a href="#faq">FAQ</a>
          <Link href="/account">My account</Link>
        </nav>
      </header>

      <main id="offer" className={styles.main}>
        <section aria-labelledby="offer-title">
          <div className={`${styles.hero} ${discounted ? styles.heroOffer : ''}`}>
            <div className={styles.heroCopy}>
              {discounted && (
                <a className={styles.community} href={LTD_OFFER.communityUrl} target="_blank" rel="noopener noreferrer" aria-label="Visit the KenMoo Facebook community">
                  <span className={styles.logoTile} data-logo="enconvo"><Image src="/logo.webp" alt="Enconvo" width={66} height={66} priority /></span>
                  <Cross2Icon aria-hidden="true" />
                  <span className={styles.logoTile}><Image src={LTD_OFFER.communityIcon} alt="KenMoo LTD community" width={56} height={56} priority /></span>
                </a>
              )}
              <p className={styles.offerLabel}>{discounted ? 'KenMoo community lifetime deal' : 'Enconvo lifetime licenses'}</p>
              <h1 id="offer-title">Your AI assistant<br />for Mac.<br /><span>{discounted ? `${percent}% off. Pay once.` : 'Pay once.'}</span></h1>
              <p className={styles.subtitle}>One payment. Everyday AI, powerful knowledge bases, and voice tools, right where you work.</p>
              {discounted && (
                <div className={styles.heroActions}>
                  <a href="#plans" className={styles.offerButton}>Choose your plan<ArrowRightIcon aria-hidden="true" /></a>
                  <p>From <s><span className="sr-only">Original price </span>{formatUsd(ltdPlans[0].originalCents)}</s> <strong>{formatUsd(ltdPriceCents(ltdPlans[0], affiliateCode))}</strong><span><CounterClockwiseClockIcon aria-hidden="true" />One-time payment · 30-day money-back guarantee</span></p>
                </div>
              )}
            </div>
            {discounted && (
              <div className={styles.ticketStage}>
                {sprinkles.map(([left, top, rotate, shape]) => (
                  <i key={`${left}-${top}`} aria-hidden="true" className={styles.sprinkle} data-shape={shape} style={{ left: `${left}%`, top: `${top}%`, rotate: `${rotate}deg` }} />
                ))}
                <button type="button" data-ticket="kenmoo" className={styles.ticket} data-claimed={ticketClaimed || undefined} aria-pressed={ticketClaimed} onClick={claimTicket}>
                  <span className={styles.ticketMain}>
                    <span className={styles.ticketEyebrow}>KenMoo community ticket</span>
                    <span className={styles.ticketValue}><strong>{percent}</strong><span><span>%</span><span>OFF</span></span></span>
                    <span className={styles.ticketTerms}>Standard, Premium, and Teams licenses</span>
                    {ticketClaimed && <span className={styles.stamp} aria-hidden="true">Claimed</span>}
                  </span>
                  <span className={styles.ticketStub}>
                    {ticketClaimed ? <><CheckIcon aria-hidden="true" />Applied automatically at checkout</> : 'Tap to claim your ticket'}
                  </span>
                </button>
                <p className={styles.ticketHint} role="status">
                  {ticketClaimed ? <>Ticket claimed. <a href="#plans">Pick your plan<ArrowRightIcon aria-hidden="true" /></a></> : 'No code needed. Your discount travels with this link.'}
                </p>
              </div>
            )}
          </div>

          {discounted && (
            <>
              <div className={styles.marquee}>
                <div className={styles.marqueeTrack}>
                  <ul aria-label="Deal highlights">{perks.map(perk => <li key={perk}>{perk}</li>)}</ul>
                  <ul aria-hidden="true">{perks.map(perk => <li key={perk}>{perk}</li>)}</ul>
                </div>
              </div>
              <ol className={styles.steps} aria-label="Your path to a lifetime license">
                {steps.map(([name, detail], index) => (
                  <li key={name} data-state={index < progress ? 'done' : index === progress ? 'current' : undefined} aria-current={index === progress ? 'step' : undefined}>
                    <span className={styles.stepMark} aria-hidden="true">{index < progress ? <CheckIcon /> : index + 1}</span>
                    <span><strong>{index < progress && <span className="sr-only">Done: </span>}{name}</strong><small>{detail}</small></span>
                  </li>
                ))}
              </ol>
            </>
          )}

          {selected ? (
            <div ref={noticeRef} className={styles.notice}>
              <p role="status">
                {canceled ? 'Checkout canceled. ' : ''}Your {selected.name} plan is selected
                {discounted ? <> at <strong>{formatUsd(ltdPriceCents(selected, affiliateCode))}</strong> with your {percent}% discount.</> : '.'}
              </p>
              <button type="button" data-checkout={selected.key} onClick={() => buy(selected)} disabled={loadingPlan !== null} aria-busy={loadingPlan === selected.key} className={styles.noticeButton}>
                {loadingPlan === selected.key ? <><ReloadIcon className={styles.spinner} />Opening checkout</> : <>{canceled ? 'Return to checkout' : 'Continue to checkout'}<ArrowRightIcon aria-hidden="true" /></>}
              </button>
            </div>
          ) : canceled ? (
            <p className={styles.notice} role="status">Checkout canceled. Choose a plan whenever you’re ready.</p>
          ) : null}

          <div id="plans" className={styles.finder}>
            <h2 id="finder-title">How many Macs will you use Enconvo on?</h2>
            <div role="radiogroup" aria-labelledby="finder-title" className={styles.finderOptions}>
              {finderOptions.map(option => (
                <label key={option.plan} data-checked={fit === option.plan || undefined}>
                  <input type="radio" name="ltd-macs" value={option.plan} checked={fit === option.plan} onChange={() => setFit(option.plan)} />
                  <LaptopIcon aria-hidden="true" />{option.label}
                </label>
              ))}
            </div>
            <p className={styles.finderResult} aria-live="polite">
              {fitPlan
                ? <><strong>{fitPlan.name}</strong>{` fits you: ${formatUsd(ltdPriceCents(fitPlan, affiliateCode))} once${fitPlan.deviceCount > 1 ? ` (${formatUsd(Math.round(ltdPriceCents(fitPlan, affiliateCode) / fitPlan.deviceCount))} per Mac)` : ''}.`}{discounted ? <strong className={styles.finderSave}>{` You save ${formatUsd(fitPlan.originalCents - ltdPriceCents(fitPlan, affiliateCode))}.`}</strong> : ''}{fitOption?.hint ? ` ${fitOption.hint}` : ''}</>
                : 'Pick one and we’ll highlight the plan that fits.'}
            </p>
          </div>

          <div className={styles.plans}>
            {ltdPlans.map(plan => (
              <article key={plan.key} id={`deal-${plan.key}`} className={`${styles.plan} ${plan.key === 'premium' ? styles.premium : ''}`} aria-labelledby={`plan-${plan.key}`} data-selected={selected?.key === plan.key || undefined} data-fit={fit === plan.key || undefined}>
                <div className={styles.planHeading}>
                  <h2 id={`plan-${plan.key}`}>{plan.name}</h2>
                  {fit === plan.key ? <span className={styles.planLabel}>Your fit</span> : plan.key === 'premium' && <span className={styles.planLabel}>Recommended</span>}
                </div>
                <p className={styles.planDescription}>{plan.description}</p>
                <div className={styles.prices}>
                  {discounted && <div className={styles.priceWas}><span className={styles.oldPrice}><span className="sr-only">Original price </span><s>{formatUsd(plan.originalCents)}</s></span><span className={styles.savings}>{`Save ${formatUsd(plan.originalCents - ltdPriceCents(plan, affiliateCode))}`}</span></div>}
                  <span className={styles.price}><span className="sr-only">{discounted ? 'Offer price ' : 'Price '}</span>{formatUsd(ltdPriceCents(plan, affiliateCode))}</span>
                  <span className={styles.priceNote}>{planPriceNote(plan, affiliateCode)}</span>
                </div>
                <button type="button" data-checkout={plan.key} onClick={() => buy(plan)} disabled={!router.isReady || loadingPlan !== null} aria-busy={loadingPlan === plan.key} aria-describedby={error?.plan === plan.key ? `error-${plan.key}` : undefined} className={styles.buyButton}>
                  {loadingPlan === plan.key ? <><ReloadIcon className={styles.spinner} />Opening checkout</> : <>Buy {plan.name}<ArrowRightIcon /></>}
                </button>
                {error?.plan === plan.key && <p id={`error-${plan.key}`} role="alert" className={styles.error}>{error.message}</p>}
                <p className={styles.planGuarantee}><CounterClockwiseClockIcon aria-hidden="true" />30-day money-back guarantee</p>
                <div className={styles.perforation} aria-hidden="true" />
                <ul className={styles.planFeatures}>
                  {[plan.devices, plan.updates, `${plan.bonusPoints} bonus`].map(feature => (
                    <li key={feature}><CheckIcon aria-hidden="true" /><span>{feature}</span></li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <p className={styles.purchaseNote}>{discounted ? `Your KenMoo ${percent}% discount is applied automatically at checkout.` : 'One-time payment.'} Prices in USD, before applicable taxes.</p>
        </section>

        <section className={styles.guarantee} aria-labelledby="guarantee-title">
          <div className={styles.seal} aria-hidden="true"><strong>30</strong><span>day</span><small>money-back</small></div>
          <div>
            <h2 id="guarantee-title">Try it for 30 days. Your money back if it’s not for you.</h2>
            <p>Every license comes with a 30-day money-back guarantee. Request a refund in Enconvo under Settings → Account, or email <a href="mailto:support@enconvo.com">support@enconvo.com</a>.</p>
          </div>
          <ul className={styles.assurance} aria-label="Purchase details">
            <li><LockClosedIcon aria-hidden="true" />Secure Stripe checkout</li>
            <li><LaptopIcon aria-hidden="true" />macOS 14+ · Intel &amp; Apple Silicon</li>
          </ul>
        </section>

        <section id="unlocks" className={styles.unlocks} aria-labelledby="unlocks-title">
          <div>
            <h2 id="unlocks-title">What every license unlocks</h2>
            <p>SmartBar, App Sidebar, PopBar, Dynamic Island, dictation, plugins, and MCP tools are free for everyone. A license removes the limits on the rest, for good.</p>
          </div>
          <ul className={styles.unlockList}>
            {unlocks.map(({ Icon, title, free }) => (
              <li key={title}><Icon aria-hidden="true" /><span><strong>{title}</strong><small>{free}</small></span></li>
            ))}
          </ul>
        </section>

        <section id="features" className={styles.features} aria-labelledby="features-title">
          <p className={styles.sectionLabel}>See Enconvo in action</p>
          <h2 id="features-title">One app. More ways to get things done.</h2>
          <p className={styles.sectionIntro}>Short demos of what Enconvo does on your Mac every day.</p>
          <div className={homeStyles.page}>
            <HeroShowcase />
          </div>
        </section>

        <section id="faq" className={styles.faq} aria-labelledby="faq-title">
          <div className={styles.faqIntro}>
            <h2 id="faq-title">A few things to know</h2>
            <p>Still have a question? Email <a href="mailto:support@enconvo.com">support@enconvo.com</a>.</p>
          </div>
          <div className={styles.faqList}>
            {[purchaseFaq, ...faqs].map(([question, answer]) => (
              <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>
            ))}
          </div>
        </section>

        {discounted && (
          <section className={styles.closingOffer} aria-labelledby="closing-title">
            <span className={styles.logoTile}><Image src={LTD_OFFER.communityIcon} alt="" width={56} height={56} /></span>
            <div><h2 id="closing-title">{`Your ${percent}% KenMoo ticket is ready.`}</h2><p>From {formatUsd(ltdPriceCents(ltdPlans[0], affiliateCode))}. One payment, with a 30-day money-back guarantee.</p></div>
            <a href="#plans" className={styles.offerButton}>Choose your plan<ArrowRightIcon aria-hidden="true" /></a>
          </section>
        )}
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Enconvo</p>
        <nav aria-label="Footer"><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><a href="https://docs.enconvo.com">Help</a></nav>
      </footer>
    </div>
  )
}
