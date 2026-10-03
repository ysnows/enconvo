import { useEffect, useState } from 'react'
import styles from '@/styles/Home.module.css'
import { affiliateCode, readAffiliateJourney } from '@/lib/affiliate-journey'
import { offerTerms, type AffiliateOffer as Offer } from '@/lib/affiliate-offer'

// One request per code for the page's lifetime, shared by the pricing section and the site notice.
const offers = new Map<string, Promise<Offer | null>>()

/**
 * The offer for the Affiliate code this browser came through (ADR 0090): the promotion code its
 * Checkout gets applied and what it takes off. Null for anyone else, or when the code wouldn't take.
 */
export function useAffiliateOffer(): Offer | null {
    const [offer, setOffer] = useState<Offer | null>(null)

    useEffect(() => {
        // The address bar first: the journey cookie is written by the app's effect, which runs after this one.
        const via = affiliateCode(new URLSearchParams(window.location.search).get('via')) ?? readAffiliateJourney()?.via
        if (!via) return
        let cancelled = false
        if (!offers.has(via)) {
            offers.set(via, fetch(`/api/affiliate/offer?via=${encodeURIComponent(via)}`)
                .then((response) => (response.ok ? response.json() : null))
                .then((body) => body?.offer ?? null)
                .catch(() => null))
        }
        offers.get(via)?.then((value) => {
            if (!cancelled) setOffer(value)
        })
        return () => {
            cancelled = true
        }
    }, [])

    return offer
}

/**
 * For a visitor an Affiliate's link brought: the pricing section's note of the code their
 * Checkout gets applied, so the price they see at Checkout is no surprise.
 */
export function AffiliateOffer() {
    const offer = useAffiliateOffer()
    if (!offer) return null
    return (
        <p className={styles.offerNote} role="status">
            Code <strong>{offer.code}</strong> is applied for you at checkout: {offerTerms(offer)}
        </p>
    )
}
