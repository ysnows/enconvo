import { useRouter } from 'next/router'
import { useI18n } from '@/i18n/I18nProvider'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { InviteRedeemMessage } from '@/components/InviteRedeemMessage'
import { useInviteRedeemed } from '@/lib/invite-auto-redeem'
import type { RedeemResult } from '@/lib/invite'

const VISIBLE_MS = 8000

/**
 * Site-wide notice for an Invite redeemed automatically after sign-in. It only
 * listens: `useInviteAutoRedeem` in `_app` does the redeeming. The landing page
 * shows its own outcome inline, and a retryable failure stays quiet.
 */
export function InviteToast() {
  const { t, locale } = useI18n()
  const router = useRouter()

  const [result, setResult] = useState<RedeemResult | null>(null)

  useInviteRedeemed((outcome) => {
    if (router.pathname === '/i/[code]') return
    if (outcome.ok || outcome.terminal) setResult(outcome)
  })

  useEffect(() => {
    if (!result) return
    const timer = setTimeout(() => setResult(null), VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [result])

  if (!result) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex justify-center px-4 sm:inset-x-auto sm:bottom-6 sm:right-6">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-hairline-strong bg-surface-card/95 py-3 pl-4 pr-1 text-left shadow-2xl backdrop-blur-md"
      >
        <InviteRedeemMessage result={result} compact />
        <button
          type="button"
          onClick={() => setResult(null)}
          className="-my-1.5 flex h-10 w-10 flex-none items-center justify-center rounded-[10px] text-content-muted transition-colors hover:bg-white/[0.06] hover:text-content"
          aria-label={t('Dismiss')}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
