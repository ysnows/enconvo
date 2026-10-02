function referralId(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 && value.length <= 200 &&
    !['null', 'undefined', 'error'].includes(value) ? value : undefined
}

/** Read only Endorsely's own attribution cookie, never a sign-in cookie. */
function storedReferral(): string | undefined {
  try {
    const cookie = document.cookie.split(';').find(item => item.trim().startsWith('endorsely_referral='))
    if (!cookie) return undefined
    return referralId(decodeURIComponent(cookie.trim().slice('endorsely_referral='.length)))
  } catch {
    return undefined
  }
}

/**
 * Endorsely resolves ?via=kenmoo to a visit ID asynchronously. Stripe needs
 * that visit ID, not the affiliate's public code. The shared site script also
 * restores it when a visitor comes here from the homepage without ?via.
 */
export async function getLtdReferral(affiliateCode?: string, timeoutMs = 3000, retainedReferral?: unknown): Promise<string | undefined> {
  if (typeof window === 'undefined') return undefined
  const deadline = Date.now() + timeoutMs
  do {
    const id = referralId(window.endorsely_referral) || storedReferral() || referralId(retainedReferral)
    if (id) return id
    // null means the shared script finished and found no attribution.
    if (!affiliateCode && window.endorsely_referral === null) return undefined
    if (Date.now() >= deadline) break
    await new Promise(resolve => setTimeout(resolve, 50))
  } while (true)

  if (affiliateCode) throw new Error('Your referral link is still loading. Please refresh this page and try again.')
  return undefined
}
