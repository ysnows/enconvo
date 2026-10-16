import { trackEvent } from '@/lib/analytics'
import { authFlowHref } from '@/lib/auth-flow'
import type { AffiliateStatus } from '@/lib/affiliate-program'

export const AFFILIATE_DASHBOARD = '/affiliate/dashboard'
export const AFFILIATE_LOGIN = authFlowHref('/login', {
  returnUrl: AFFILIATE_DASHBOARD,
})
export const AFFILIATE_RESET = authFlowHref('/reset_password_send', {
  returnUrl: AFFILIATE_DASHBOARD,
})

type AffiliateAction =
  | 'sign_in_clicked'
  | 'password_reset_clicked'
  | 'password_reset_requested'
  | 'password_changed'
  | 'portal_opened'
  | 'account_switched'

/** No account, code, return URL or page context goes to analytics. */
export function trackAffiliateAction(
  action: AffiliateAction,
  status?: AffiliateStatus
) {
  trackEvent(
    'website_affiliate_action',
    { action, ...(status ? { status } : {}) },
    { includePagePath: false }
  )
}
