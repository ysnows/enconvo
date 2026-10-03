import { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { AffiliateDashboard } from '@/components/affiliate/AffiliateDashboard'
import { AffiliateFaq, AffiliateHero, HowItWorks, TermsCards } from '@/components/affiliate/AffiliateLanding'
import { ApplicationForm } from '@/components/affiliate/ApplicationForm'
import { PendingApplication, RejectedNotice } from '@/components/affiliate/ApplicationStatus'
import { TeamMessage } from '@/components/affiliate/Announcement'
import { card, Notice } from '@/components/affiliate/ui'
import { Footer } from '@/components/Footer'
import { SiteNav } from '@/components/SiteNav'
import {
    DEFAULT_TERMS,
    fetchProgramTerms,
    getAffiliateDashboard,
    type AffiliateApplication,
    type AffiliateDashboard as Dashboard,
    type ProgramTerms,
} from '@/lib/affiliate-program'
import { supabase } from '@/lib/supabase'

// The Affiliate portal (ADR 0090). Signed out or not yet applied: what the program pays and
// the application form. Pending or rejected: the application. Approved or suspended: the dashboard.

interface Session {
    userId: string
    token: string
    email: string | null
}

type Load = { state: 'idle' } | { state: 'loading' } | { state: 'loaded'; data: Dashboard } | { state: 'error'; message: string; expired: boolean }

function FormPlaceholder({ children }: { children?: React.ReactNode }) {
    return (
        <section id="apply" className="scroll-mt-28 grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
            <div>
                <h2 className="text-3xl font-semibold text-content">Apply</h2>
                <p className="mt-4 text-base leading-7 text-content-body">You apply with your Enconvo account.</p>
            </div>
            <div className={`${card} flex min-h-[240px] items-center justify-center p-4 sm:p-8`}>
                {children ?? <Loader2 className="h-5 w-5 animate-spin text-content-muted" aria-label="Loading" />}
            </div>
        </section>
    )
}

export default function AffiliatePage() {
    // undefined while the stored session is read.
    const [session, setSession] = useState<Session | null | undefined>(undefined)
    const [terms, setTerms] = useState<ProgramTerms>(DEFAULT_TERMS)
    const [load, setLoad] = useState<Load>({ state: 'idle' })
    const [editing, setEditing] = useState(false)
    const userId = session?.userId
    const token = session?.token

    useEffect(() => {
        let cancelled = false
        const apply = (value: { user: { id: string; email?: string }; access_token: string } | null) => {
            if (cancelled) return
            setSession(value ? { userId: value.user.id, token: value.access_token, email: value.user.email ?? null } : null)
        }
        void supabase.auth.getSession().then(({ data }) => apply(data.session))
        const { data: listener } = supabase.auth.onAuthStateChange((_event, value) => apply(value))
        void fetchProgramTerms().then((result) => {
            if (!cancelled && result.ok) setTerms(result.data)
        })
        return () => {
            cancelled = true
            listener.subscription.unsubscribe()
        }
    }, [])

    const refresh = useCallback(async (accessToken: string) => {
        setLoad({ state: 'loading' })
        const result = await getAffiliateDashboard(accessToken)
        if (result.ok) {
            setLoad({ state: 'loaded', data: result.data })
            setTerms(result.data.program)
        } else {
            setLoad({ state: 'error', message: result.message, expired: result.status === 401 })
        }
    }, [])

    // Reload when the account changes, not on every token refresh.
    useEffect(() => {
        setEditing(false)
        if (!userId || !token) {
            setLoad({ state: 'idle' })
            return
        }
        void refresh(token)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, refresh])

    const affiliate = load.state === 'loaded' ? load.data.affiliate : null
    const updateAffiliate = (next: AffiliateApplication) => {
        setLoad((current) => (current.state === 'loaded' ? { state: 'loaded', data: { ...current.data, affiliate: next } } : current))
    }
    // A change made on the dashboard also fetches it again, quietly, so the account's history shows it.
    const changedOnDashboard = (next: AffiliateApplication) => {
        updateAffiliate(next)
        if (!token) return
        void getAffiliateDashboard(token).then((result) => {
            if (result.ok) setLoad((current) => (current.state === 'loaded' ? { state: 'loaded', data: result.data } : current))
        })
    }
    const submitted = (application: AffiliateApplication) => {
        updateAffiliate(application)
        setEditing(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    const signOut = () => void supabase.auth.signOut({ scope: 'local' })

    let content: React.ReactNode
    if (affiliate && (affiliate.status === 'approved' || affiliate.status === 'suspended') && load.state === 'loaded') {
        content = <AffiliateDashboard data={load.data} accessToken={token} email={session?.email ?? null} onAffiliateChanged={changedOnDashboard} />
    } else if (affiliate?.status === 'pending' && !editing) {
        content = <PendingApplication application={affiliate} onEdit={() => setEditing(true)} />
    } else if (affiliate) {
        // Rejected, or a pending application being edited.
        content = (
            <div className="space-y-8">
                {affiliate.status === 'rejected' ? <RejectedNotice message={affiliate.message} /> : <TeamMessage message={affiliate.message} />}
                <ApplicationForm
                    terms={terms}
                    accessToken={token}
                    email={session?.email ?? null}
                    previous={affiliate}
                    onSubmitted={submitted}
                    onCancel={affiliate.status === 'pending' ? () => setEditing(false) : undefined}
                />
            </div>
        )
    } else {
        let apply: React.ReactNode
        if (session === undefined || load.state === 'loading' || (session && load.state === 'idle')) {
            apply = <FormPlaceholder />
        } else if (load.state === 'error') {
            apply = (
                <FormPlaceholder>
                    <div className="w-full max-w-md">
                        <Notice
                            tone="error"
                            title={load.expired ? 'Your sign-in has expired' : "We couldn't load your Affiliate account"}
                            action={
                                load.expired ? (
                                    <Link href="/login?returnUrl=%2Faffiliate" onClick={signOut} className="flex-none text-sm font-medium text-signal-blue hover:underline">
                                        Sign in
                                    </Link>
                                ) : (
                                    <button type="button" onClick={() => void refresh(token)} className="flex-none text-sm font-medium text-signal-blue hover:underline">
                                        Try again
                                    </button>
                                )
                            }
                        >
                            {load.expired ? 'Sign in again to apply or see your dashboard.' : load.message}
                        </Notice>
                    </div>
                </FormPlaceholder>
            )
        } else {
            apply = (
                <ApplicationForm
                    terms={terms}
                    accessToken={session ? token : null}
                    email={session?.email ?? null}
                    previous={null}
                    onSubmitted={submitted}
                    onSignOut={session ? signOut : undefined}
                />
            )
        }
        content = (
            <div className="space-y-20 lg:space-y-24">
                <AffiliateHero terms={terms} />
                <TermsCards terms={terms} />
                <HowItWorks />
                {apply}
                <AffiliateFaq terms={terms} />
            </div>
        )
    }

    return (
        <>
            <Head>
                <title>Affiliate program - Enconvo</title>
                <meta
                    name="description"
                    content={`Earn ${terms.commission_rate}% of every payment from customers you refer to Enconvo, renewals included. Paid monthly by PayPal or Wise.`}
                />
                <link rel="canonical" href="https://enconvo.com/affiliate" />
            </Head>
            <div className="min-h-screen bg-canvas text-content">
                <SiteNav />
                <main className="mx-auto max-w-[1240px] px-6 pb-24 pt-36 lg:px-12">{content}</main>
                <Footer />
            </div>
        </>
    )
}
