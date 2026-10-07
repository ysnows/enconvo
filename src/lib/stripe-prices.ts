import { isLifetimeKey, lifetimePrices } from './lifetime-pricing'

// The Stripe price behind each plan the website sells, by the lookup key its buttons send.
// Lifetime licenses follow their schedule (lifetime-pricing.ts) instead.
export const PRICE_IDS: Record<string, string> = {
    monthly: 'price_1PUnZ5P5mwiRKlICwO3oKaJZ',
    yearly: 'price_1PUnbcP5mwiRKlICBAdbINOS',
    // Cloud tiers Pro/Max (ADR 0034)
    pro_monthly: 'price_1TtzpnP5mwiRKlICF1zwDrRO',
    pro_yearly: 'price_1TtzpxP5mwiRKlIC2O3cX0rd',
    max_monthly: 'price_1TtzqDP5mwiRKlICEj5Nkmun',
    max_yearly: 'price_1TtzqPP5mwiRKlIC3lNm6g81',
    '250000_points': 'price_1Qx9GDP5mwiRKlICDn53Og5c',
    '1500000_points': 'price_1Qx9NTP5mwiRKlIC8vIK1Ym1',
    '3000000_points': 'price_1Qx9QYP5mwiRKlICzdVj9Nx3',
}

/**
 * The Stripe price a Checkout for `lookupKey` charges at `now`. Teams lifetime license
 * (ADR 0036): the base covers 5 seats; extra seats ride the seat add-on price with
 * quantity, and `teams_seat` alone grows an existing license.
 */
export function checkoutPriceId(lookupKey: string, now = Date.now()): string | undefined {
    if (isLifetimeKey(lookupKey)) return lifetimePrices(now)[lookupKey].id
    return Object.hasOwn(PRICE_IDS, lookupKey) ? PRICE_IDS[lookupKey] : undefined
}
