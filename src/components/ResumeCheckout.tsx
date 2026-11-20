import Head from 'next/head'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/I18nProvider'
import { LEFT_FOR_CHECKOUT_KEY, type PurchaseReturn } from '@/lib/auth-flow'

/** `going`: on the way to Stripe. `failed`: checkout didn't open. `ready`: back from Stripe through history. */
export type ResumeCheckoutState = 'going' | 'failed' | 'ready'

/**
 * Takes a buyer who signed in on the way to checkout (`purchaseReturn`) on to that plan's Stripe
 * checkout as soon as the page knows they're signed in, however they signed in: a password, an
 * email confirmation link, or Google or Apple, which come back to the page already signed in.
 * It starts once per sign-in; a failure or a return through the browser's history waits for a click.
 */
export function useResumeCheckout(
  purchase: PurchaseReturn | null,
  signedIn: boolean,
  locale: string
) {
  const [state, setState] = useState<ResumeCheckoutState>('going')
  const started = useRef(false)
  const plan = purchase?.plan
  const ownCode = purchase?.ownCode ?? false

  const go = useCallback(async () => {
    if (!plan) return
    started.current = true
    setState('going')
    try {
      const response = await fetch('/api/subscription/checkout_sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lookupKey: plan,
          locale,
          endorsely_referral: (window as { endorsely_referral?: unknown })
            .endorsely_referral,
          // The buyer chose "Use another code instead" (Pricing.tsx).
          ...(ownCode ? { ownCode: true } : {}),
        }),
      })
      const data = await response.json().catch(() => null)
      if (response.ok && typeof data?.url === 'string') {
        rememberLeft(plan)
        window.location.assign(data.url)
        return
      }
      console.error('Checkout did not open:', response.status, data)
    } catch (error) {
      console.error('Checkout did not open:', error)
    }
    setState('failed')
  }, [plan, ownCode, locale])

  useEffect(() => {
    // Signed out (Log out on the page): the next sign-in starts checkout again.
    if (!signedIn) started.current = false
    else if (plan && !started.current) {
      started.current = true
      // Back from Stripe: the buyer chose to leave it, so wait for a click.
      if (takeLeft() === plan) setState('ready')
      else void go()
    }
  }, [signedIn, plan, go])

  useEffect(() => {
    // Back from Stripe out of the browser's page cache, still showing "Going to checkout".
    const restored = (event: PageTransitionEvent) => {
      if (!event.persisted) return
      takeLeft()
      setState('ready')
    }
    window.addEventListener('pageshow', restored)
    return () => window.removeEventListener('pageshow', restored)
  }, [])

  return { state, retry: go }
}

function rememberLeft(plan: string) {
  try {
    sessionStorage.setItem(LEFT_FOR_CHECKOUT_KEY, plan)
  } catch {}
}

/** The plan this tab left for checkout, once: a reload after that goes on to checkout again. */
function takeLeft() {
  try {
    const plan = sessionStorage.getItem(LEFT_FOR_CHECKOUT_KEY)
    sessionStorage.removeItem(LEFT_FOR_CHECKOUT_KEY)
    return plan
  } catch {
    return null
  }
}

/** What /login and /register show a signed-in buyer instead of "You're signed in". */
export function ResumeCheckout({
  state,
  onContinue,
}: {
  state: ResumeCheckoutState
  onContinue: () => void
}) {
  const { t } = useI18n()
  const title =
    state === 'going'
      ? t('Going to checkout...')
      : state === 'failed'
      ? t('Could not open checkout. Please try again.')
      : t("You're signed in")

  return (
    <>
      <Head>
        <title>{`${t('Continue to checkout')} - Enconvo`}</title>
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A1A]">
        <div
          className="flex w-full max-w-[480px] flex-col items-center space-y-8 px-4"
          data-resume-checkout={state}
        >
          <Logo className="h-16 w-auto" />
          <h3
            role="status"
            className="text-center text-3xl font-medium tracking-tight text-white"
          >
            {title}
          </h3>
          {state === 'going' ? (
            <Loader2
              className="h-6 w-6 animate-spin text-[#888888]"
              aria-hidden="true"
            />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Button
                onClick={onContinue}
                className="h-10 min-w-[200px] rounded-[10px] bg-[#E5E5E5] px-6 font-medium text-[#1A1A1A] transition-all duration-200 hover:bg-[#D4D4D4]"
              >
                {t(state === 'failed' ? 'Try again' : 'Continue to checkout')}
              </Button>
              <Link
                href="/#pricing"
                className="text-sm text-[#888888] transition-colors hover:text-white"
              >
                {t('View pricing')}
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
