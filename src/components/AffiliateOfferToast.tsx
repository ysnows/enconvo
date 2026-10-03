import { I18nText } from '@/i18n/I18nText'
import { useI18n } from '@/i18n/I18nProvider'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { BadgePercent, X } from 'lucide-react'
import { useAffiliateOffer } from '@/components/AffiliateOffer'
import { offerTerms } from '@/lib/affiliate-offer'

// The public pages a referred visitor browses before choosing a plan.
// /downloads is the privacy policy, not a place to choose a plan.
const OFFER_PAGES = new Set(['/', '/use-cases', '/changelog', '/cloud-pricing'])
// The code whose notice this browser dismissed; another Affiliate's code shows again.
const DISMISSED_KEY = 'enconvo_offer_dismissed'

function readDismissed(): string | null {
  try {
    return localStorage.getItem(DISMISSED_KEY)
  } catch {
    return null
  }
}

/**
 * Site-wide notice for a visitor an Affiliate's link brought (ADR 0090): the promotion code their
 * Checkout gets applied, from whichever page they are on, with a way to the plans. It steps
 * aside while the pricing section, which says the same, is on screen, and stays away once
 * dismissed or followed.
 */
export function AffiliateOfferToast() {
  const { t, locale } = useI18n()

  const router = useRouter()
  const offer = useAffiliateOffer()
  const [dismissed, setDismissed] = useState<string | null>(readDismissed)
  const [pricingInView, setPricingInView] = useState(false)
  const onPage = OFFER_PAGES.has(router.pathname)

  useEffect(() => {
    if (!offer || !onPage || typeof IntersectionObserver === 'undefined') return
    const section = document.getElementById('pricing')
    if (!section) return
    const observer = new IntersectionObserver(([entry]) =>
      setPricingInView(entry.isIntersecting)
    )
    observer.observe(section)
    return () => {
      observer.disconnect()
      setPricingInView(false)
    }
  }, [offer, onPage, router.asPath])

  if (!offer || !onPage || pricingInView || dismissed === offer.code)
    return null

  const dismiss = () => {
    setDismissed(offer.code)
    try {
      localStorage.setItem(DISMISSED_KEY, offer.code)
    } catch {}
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex justify-center px-4 sm:inset-x-auto sm:bottom-6 sm:left-6">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-hairline-strong bg-surface-card/95 py-3 pl-4 pr-1 text-left shadow-2xl backdrop-blur-md"
      >
        <BadgePercent
          className="mt-0.5 h-5 w-5 flex-none text-signal-blue"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1 py-0.5">
          <p className="text-sm font-medium text-content">
            <I18nText
              source={'Code {p0} is applied for you at checkout'}
              values={{
                p0: <span className="tracking-[0.02em]">{offer.code}</span>,
              }}
            />
          </p>
          <p className="mt-0.5 text-[13px] leading-[18px] text-content-muted">
            {t(offerTerms(offer))}
          </p>
          <Link
            href="/#pricing"
            onClick={dismiss}
            className="mt-2 inline-block text-[13px] font-medium text-signal-blue hover:underline"
          >
            {t('See plans')}
          </Link>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="-my-1.5 flex h-10 w-10 flex-none items-center justify-center rounded-[10px] text-content-muted transition-colors hover:bg-white/[0.06] hover:text-content"
          aria-label={t('Dismiss')}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
