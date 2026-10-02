import { useEffect, useState } from 'react'
import styles from '@/styles/Home.module.css'
import { affiliateCode, readAffiliateJourney } from '@/lib/affiliate-journey'
import { offerTerms, type AffiliateOffer as Offer } from '@/lib/affiliate-offer'

/**
 * For a visitor an Affiliate's link brought (ADR 0090): the promotion code their Checkout gets
 * applied, and what it takes off, so the price they see at Checkout is no surprise. Nothing
 * for anyone else, or when the code wouldn't take.
 */
export function AffiliateOffer() {
    const [offer, setOffer] = useState<Offer | null>(null)

    useEffect(() => {
        // The address bar first: the journey cookie is written by the app's effect, which runs after this one.
        const via = affiliateCode(new URLSearchParams(window.location.search).get('via')) ?? readAffiliateJourney()?.via
        if (!via) return
        const controller = new AbortController()
        fetch(`/api/affiliate/offer?via=${encodeURIComponent(via)}`, { signal: controller.signal })
            .then((response) => (response.ok ? response.json() : null))
            .then((body) => setOffer(body?.offer ?? null))
            .catch(() => null)
        return () => controller.abort()
    }, [])

    if (!offer) return null
    return (
        <p className={styles.offerNote} role="status">
            Code <strong>{offer.code}</strong> is applied for you at checkout: {offerTerms(offer)}
        </p>
    )
}
