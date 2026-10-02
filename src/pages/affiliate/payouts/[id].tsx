import { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowLeft, Download, Loader2, Printer } from 'lucide-react'
import { isoDay } from '@/components/affiliate/AffiliateTables'
import { exportPayoutStatement, PayoutStatement } from '@/components/affiliate/PayoutStatement'
import { Notice } from '@/components/affiliate/ui'
import { Footer } from '@/components/Footer'
import { SiteNav } from '@/components/SiteNav'
import { getPayoutStatement, type AffiliatePayoutStatement } from '@/lib/affiliate-program'
import { supabase } from '@/lib/supabase'

// One payout's statement for the signed-in Affiliate (ADR 0090), linked from the dashboard's
// Payouts tab. The Worker answers 404 for a payout on any other account.

interface Session {
    userId: string
    token: string
}

type Load =
    | { state: 'loading' }
    | { state: 'loaded'; data: AffiliatePayoutStatement }
    | { state: 'error'; message: string; status: number }

const action = 'inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-hairline bg-surface-elevated px-4 text-sm font-medium text-content transition-colors hover:border-hairline-strong hover:bg-white/[0.06]'
const textLink = 'flex-none text-sm font-medium text-signal-blue hover:underline'

export default function PayoutStatementPage() {
    const router = useRouter()
    const id = router.isReady ? String((Array.isArray(router.query.id) ? router.query.id[0] : router.query.id) ?? '') : null
    // undefined while the stored session is read.
    const [session, setSession] = useState<Session | null | undefined>(undefined)
    const [load, setLoad] = useState<Load>({ state: 'loading' })
    const userId = session?.userId
    const token = session?.token

    useEffect(() => {
        let cancelled = false
        const apply = (value: { user: { id: string }; access_token: string } | null) => {
            if (!cancelled) setSession(value ? { userId: value.user.id, token: value.access_token } : null)
        }
        void supabase.auth.getSession().then(({ data }) => apply(data.session))
        const { data: listener } = supabase.auth.onAuthStateChange((_event, value) => apply(value))
        return () => {
            cancelled = true
            listener.subscription.unsubscribe()
        }
    }, [])

    const fetchStatement = useCallback(async (accessToken: string, payoutId: string) => {
        setLoad({ state: 'loading' })
        const result = await getPayoutStatement(accessToken, payoutId)
        setLoad(result.ok ? { state: 'loaded', data: result.data } : { state: 'error', message: result.message, status: result.status })
    }, [])

    // Reload when the account or the payout changes, not on every token refresh.
    useEffect(() => {
        if (!userId || !token || id === null) return
        void fetchStatement(token, id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, id, fetchStatement])

    const signOut = () => void supabase.auth.signOut({ scope: 'local' })
    const signIn = `/login?returnUrl=${encodeURIComponent(id ? `/affiliate/payouts/${id}` : '/affiliate')}`
    const back = (
        <Link href="/affiliate" className={textLink}>
            Back to dashboard
        </Link>
    )

    let content: React.ReactNode
    if (session === null) {
        content = (
            <Notice
                tone="info"
                title="Sign in to see this statement"
                action={
                    <Link href={signIn} className={textLink}>
                        Sign in
                    </Link>
                }
            >
                Payout statements are shown only to the Affiliate they were paid to.
            </Notice>
        )
    } else if (session === undefined || id === null || load.state === 'loading') {
        content = (
            <div className="flex min-h-[320px] items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-content-muted" aria-label="Loading" />
            </div>
        )
    } else if (load.state === 'error') {
        content =
            load.status === 404 ? (
                <Notice tone="warn" title="We couldn't find this payout" action={back}>
                    It may have been paid to another account. Your payouts are listed on the dashboard&apos;s Payouts tab.
                </Notice>
            ) : load.status === 401 ? (
                <Notice
                    tone="error"
                    title="Your sign-in has expired"
                    action={
                        <Link href={signIn} onClick={signOut} className={textLink}>
                            Sign in
                        </Link>
                    }
                >
                    Sign in again to see this statement.
                </Notice>
            ) : (
                <Notice
                    tone="error"
                    title="We couldn't load this statement"
                    action={
                        <button type="button" onClick={() => token && void fetchStatement(token, id)} className={textLink}>
                            Try again
                        </button>
                    }
                >
                    {load.message}
                </Notice>
            )
    } else {
        content = <PayoutStatement data={load.data} />
    }

    const data = load.state === 'loaded' ? load.data : null
    return (
        <>
            <Head>
                {/* The title is the default file name when the statement is saved as a PDF. */}
                <title>{data ? `Enconvo payout statement ${isoDay(data.payout.paid_at)}` : 'Payout statement - Enconvo'}</title>
                <meta name="robots" content="noindex" />
            </Head>
            <div className="min-h-screen bg-canvas text-content print:bg-white print:text-black">
                <div className="print:hidden">
                    <SiteNav />
                </div>
                <main className="mx-auto max-w-[1040px] px-4 pb-24 pt-32 sm:px-6 lg:px-12 lg:pt-36 print:max-w-none print:p-0">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
                        <Link href="/affiliate" className="inline-flex items-center gap-2 text-sm text-content-muted transition-colors hover:text-content">
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Affiliate dashboard
                        </Link>
                        {data && (
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => exportPayoutStatement(data)} className={action}>
                                    <Download className="h-4 w-4" aria-hidden="true" />
                                    Download CSV
                                </button>
                                <button type="button" onClick={() => window.print()} className={action}>
                                    <Printer className="h-4 w-4" aria-hidden="true" />
                                    Print or save PDF
                                </button>
                            </div>
                        )}
                    </div>
                    {content}
                </main>
                <div className="print:hidden">
                    <Footer />
                </div>
            </div>
        </>
    )
}
