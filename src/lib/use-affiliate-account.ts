import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import {
  getAffiliateDashboard,
  type AffiliateApplication,
  type AffiliateDashboard,
} from '@/lib/affiliate-program'

export type AffiliateAccountState =
  | { state: 'loading'; session?: Session }
  | { state: 'signed_out'; session?: undefined }
  | { state: 'loaded'; session: Session; data: AffiliateDashboard }
  | { state: 'error'; session?: Session; message: string; expired: boolean }

/** Account changes invalidate every earlier request before its response can display. */
export function useAffiliateAccount() {
  const [account, setAccount] = useState<AffiliateAccountState>({
    state: 'loading',
  })
  const session = useRef<Session | null>(null)
  const generation = useRef(0)
  const mounted = useRef(false)

  const load = useCallback(async function loadAccount(
    current: Session,
    quiet = false
  ) {
    const request = ++generation.current
    if (!quiet) setAccount({ state: 'loading', session: current })
    const result = await getAffiliateDashboard(current.access_token)
    if (!mounted.current || request !== generation.current) return
    // Token refreshes update the stored session while this request is in flight.
    const latest = session.current
    if (!latest || latest.user.id !== current.user.id) return
    if (
      !result.ok &&
      result.status === 401 &&
      latest.access_token !== current.access_token
    )
      return loadAccount(latest, quiet)
    setAccount(
      result.ok
        ? { state: 'loaded', session: latest, data: result.data }
        : {
            state: 'error',
            session: latest,
            message: result.message,
            expired: result.status === 401,
          }
    )
  },
  [])

  const readSession = useCallback(async () => {
    const request = generation.current
    try {
      const { data, error } = await supabase.auth.getSession()
      if (!mounted.current || request !== generation.current) return
      if (error) throw error
      session.current = data.session
      if (data.session) void load(data.session)
      else setAccount({ state: 'signed_out' })
    } catch {
      if (mounted.current && request === generation.current)
        setAccount({
          state: 'error',
          message: "We couldn't load your Affiliate account",
          expired: false,
        })
    }
  }, [load])

  useEffect(() => {
    mounted.current = true
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, next) => {
        const previous = session.current
        session.current = next
        if (next && previous?.user.id === next.user.id) {
          setAccount((current) =>
            current.state === 'signed_out'
              ? current
              : { ...current, session: next }
          )
          return
        }
        ++generation.current
        if (next) void load(next)
        else setAccount({ state: 'signed_out' })
      }
    )
    void readSession()
    return () => {
      mounted.current = false
      // This ref is an async request counter, not a DOM node to capture at setup.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ++generation.current
      listener.subscription.unsubscribe()
    }
  }, [load, readSession])

  const refresh = useCallback(
    (quiet = false) => {
      if (session.current) return load(session.current, quiet)
      return readSession()
    },
    [load, readSession]
  )

  const userId = account.session?.user.id
  const updateAffiliate = useCallback(
    (affiliate: AffiliateApplication) => {
      if (!userId || session.current?.user.id !== userId) return
      setAccount((current) =>
        current.state === 'loaded'
          ? { ...current, data: { ...current.data, affiliate } }
          : current
      )
    },
    [userId]
  )

  return { account, refresh, updateAffiliate }
}
