import { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowLeft, Download, Loader2, Printer } from 'lucide-react'
import { Notice } from '@/components/affiliate/ui'
import { exportYearStatement, YearStatement, yearStatementTitle } from '@/components/affiliate/YearStatement'
import { Footer } from '@/components/Footer'
import { SiteNav } from '@/components/SiteNav'
import { getYearStatement, type AffiliateYearStatement } from '@/lib/affiliate-program'
import { supabase } from '@/lib/supabase'

// One calendar year's earnings statement for the signed-in Affiliate (ADR 0090), linked from the dashboard's monthly
// statement. The Worker answers 400 for a year before the account's first or after this one.

interface Session {
    userId: string
    token: string
}

type Load = { state: 'loading' } | { state: 'loaded'; data: AffiliateYearStatement } | { state: 'error'; message: string; status: number }

const action =
    'inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-hairline bg-surface-elevated px-4 text-sm font-medium text-content transition-colors hover:border-hairline-strong hover:bg-white/[0.06]'
const textLink = 'flex-none text-sm font-medium text-signal-blue hover:underline'

export default function YearStatementPage() {
    const router = useRouter()
    const raw = router.isReady ? String((Array.isArray(router.query.year) ? router.query.year[0] : router.query.year) ?? '') : null
    const year = raw === null ? null : /^\d{4}$/.test(raw) ? Number(raw) : NaN
    const currentYear = new Date().getUTCFullYear()
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

    const fetchStatement = useCallback(async (accessToken: string, value: number) => {
        setLoad({ state: 'loading' })
        if (!Number.isInteger(value)) return setLoad({ state: 'error', message: 'Not a year.', status: 400 })
        const result = await getYearStatement(accessToken, value)
        setLoad(result.ok ? { state: 'loaded', data: result.data } : { state: 'error', message: result.message, status: result.status })
    }, [])

    // Reload when the account or the year changes, not on every token refresh.
    useEffect(() => {
        if (!userId || !token || year === null) return
        void fetchStatement(token, year)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, year, fetchStatement])

    const signOut = () => void supabase.auth.signOut({ scope: 'local' })
    const signIn = `/login?returnUrl=${encodeURIComponent(raw ? `/affiliate/statements/${raw}` : '/affiliate')}`
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
                Earnings statements are shown only to the Affiliate they belong to.
            </Notice>
        )
    } else if (session === undefined || year === null || load.state === 'loading') {
        content = (
            <div className="flex min-h-[320px] items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-content-muted" aria-label="Loading" />
            </div>
        )
    } else if (load.state === 'error') {
        content =
            load.status === 400 ? (
                <Notice
                    tone="warn"
                    title={`There's no statement for ${raw}`}
                    action={
                        <Link href={`/affiliate/statements/${currentYear}`} className={textLink}>
                            See {currentYear}
                        </Link>
                    }
                >
                    Statements cover each year from your first in the program to this one.
                </Notice>
            ) : load.status === 404 ? (
                <Notice tone="warn" title="Earnings statements are for Affiliates" action={back}>
                    Once your application is approved, a statement of each year&apos;s earnings and payouts shows up here.
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
                        <button type="button" onClick={() => token && void fetchStatement(token, year)} className={textLink}>
                            Try again
                        </button>
                    }
                >
                    {load.message}
                </Notice>
            )
    } else {
        content = <YearStatement data={load.data} />
    }

    const data = load.state === 'loaded' ? load.data : null
    return (
        <>
            <Head>
                {/* The title is the default file name when the statement is saved as a PDF. */}
                <title>{data ? yearStatementTitle(data) : 'Earnings statement - Enconvo'}</title>
                <meta name="robots" content="noindex" />
            </Head>
            <div className="min-h-screen bg-canvas text-content print:bg-white print:text-black">
                <div className="print:hidden">
                    <SiteNav />
                </div>
                <main className="mx-auto max-w-[1040px] px-4 pb-24 pt-32 print:max-w-none print:p-0 sm:px-6 lg:px-12 lg:pt-36">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
                        <Link
                            href="/affiliate"
                            className="inline-flex items-center gap-2 text-sm text-content-muted transition-colors hover:text-content"
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Affiliate dashboard
                        </Link>
                        {data && (
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => exportYearStatement(data)} className={action}>
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
                    {data && data.years.length > 1 && (
                        <nav aria-label="Statement year" className="mb-6 flex flex-wrap gap-2 print:hidden">
                            {data.years.map((value) => (
                                <Link
                                    key={value}
                                    href={`/affiliate/statements/${value}`}
                                    aria-current={value === data.year ? 'page' : undefined}
                                    className={`inline-flex min-h-[36px] items-center rounded-full border px-4 text-sm tabular-nums transition-colors ${
                                        value === data.year
                                            ? 'border-hairline-strong bg-white/[0.08] font-medium text-content'
                                            : 'border-hairline text-content-muted hover:text-content'
                                    }`}
                                >
                                    {value}
                                </Link>
                            ))}
                        </nav>
                    )}
                    {content}
                </main>
                <div className="print:hidden">
                    <Footer />
                </div>
            </div>
        </>
    )
}
