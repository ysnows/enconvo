import { i18nServerSideProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowLeft, Download, Loader2, Printer } from 'lucide-react'
import { isoDay } from '@/components/affiliate/AffiliateTables'
import {
  exportPayoutStatement,
  PayoutStatement,
} from '@/components/affiliate/PayoutStatement'
import { Notice } from '@/components/affiliate/ui'
import { Footer } from '@/components/Footer'
import { SiteNav } from '@/components/SiteNav'
import {
  getAllCommissions,
  getPayoutStatement,
  type AffiliatePayoutStatement,
} from '@/lib/affiliate-program'
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

const action =
  'inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-hairline bg-surface-elevated px-4 text-sm font-medium text-content transition-colors hover:border-hairline-strong hover:bg-white/[0.06] disabled:cursor-wait disabled:opacity-60'
const textLink =
  'flex-none text-sm font-medium text-signal-blue hover:underline'

export default function PayoutStatementPage() {
  const { t, locale } = useI18n()

  const router = useRouter()
  const id = router.isReady
    ? String(
        (Array.isArray(router.query.id)
          ? router.query.id[0]
          : router.query.id) ?? ''
      )
    : null
  // undefined while the stored session is read.
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const userId = session?.userId
  const token = session?.token

  useEffect(() => {
    let cancelled = false
    const apply = (
      value: { user: { id: string }; access_token: string } | null
    ) => {
      if (!cancelled)
        setSession(
          value ? { userId: value.user.id, token: value.access_token } : null
        )
    }
    void supabase.auth.getSession().then(({ data }) => apply(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, value) => apply(value)
    )
    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  const fetchStatement = useCallback(
    async (accessToken: string, payoutId: string) => {
      setLoad({ state: 'loading' })
      const result = await getPayoutStatement(accessToken, payoutId)
      setLoad(
        result.ok
          ? { state: 'loaded', data: result.data }
          : { state: 'error', message: result.message, status: result.status }
      )
    },
    []
  )

  // Reload when the account or the payout changes, not on every token refresh.
  useEffect(() => {
    if (!userId || !token || id === null) return
    void fetchStatement(token, id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, id, fetchStatement])

  // A statement lists the newest 1,000 entries; its CSV fetches every entry the payout settled.
  const download = async (statement: AffiliatePayoutStatement) => {
    setExportError(null)
    if (!statement.entries_truncated || !token)
      return exportPayoutStatement(statement)
    setExporting(true)
    const result = await getAllCommissions(token, statement.payout.id)
    setExporting(false)
    if (result.ok) exportPayoutStatement(statement, result.data)
    else setExportError(`We couldn't prepare the CSV. ${result.message}`)
  }

  const signOut = () => void supabase.auth.signOut({ scope: 'local' })
  const signIn = `/login?returnUrl=${encodeURIComponent(
    id ? `/affiliate/payouts/${id}` : '/affiliate'
  )}`
  const back = (
    <Link href="/affiliate" className={textLink}>
      {t('Back to dashboard')}
    </Link>
  )

  let content: React.ReactNode
  if (session === null) {
    content = (
      <Notice
        tone="info"
        title={t('Sign in to see this statement')}
        action={
          <Link href={signIn} className={textLink}>
            {t('Sign in')}
          </Link>
        }
      >
        {t(
          'Payout statements are shown only to the Affiliate they were paid to.'
        )}
      </Notice>
    )
  } else if (session === undefined || id === null || load.state === 'loading') {
    content = (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2
          className="h-5 w-5 animate-spin text-content-muted"
          aria-label={t('Loading')}
        />
      </div>
    )
  } else if (load.state === 'error') {
    content =
      load.status === 404 ? (
        <Notice
          tone="warn"
          title={t("We couldn't find this payout")}
          action={back}
        >
          {t(
            "It may have been paid to another account. Your payouts are listed on the dashboard's Payouts tab."
          )}
        </Notice>
      ) : load.status === 401 ? (
        <Notice
          tone="error"
          title={t('Your sign-in has expired')}
          action={
            <Link href={signIn} onClick={signOut} className={textLink}>
              {t('Sign in')}
            </Link>
          }
        >
          {t('Sign in again to see this statement.')}
        </Notice>
      ) : (
        <Notice
          tone="error"
          title={t("We couldn't load this statement")}
          action={
            <button
              type="button"
              onClick={() => token && void fetchStatement(token, id)}
              className={textLink}
            >
              {t('Try again')}
            </button>
          }
        >
          {t(load.message)}
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
        <title>
          {data
            ? t('Enconvo payout statement {p0}', {
                p0: isoDay(data.payout.paid_at),
              })
            : t('Payout statement - Enconvo')}
        </title>
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
              {t('Affiliate dashboard')}
            </Link>
            {data && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void download(data)}
                  disabled={exporting}
                  className={action}
                >
                  {exporting ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Download className="h-4 w-4" aria-hidden="true" />
                  )}
                  {exporting ? t('Preparing CSV…') : t('Download CSV')}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className={action}
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  {t('Print or save PDF')}
                </button>
              </div>
            )}
          </div>
          {exportError && (
            <p
              role="alert"
              className="-mt-3 mb-6 text-right text-xs leading-5 text-signal-red print:hidden"
            >
              {t(exportError)}
            </p>
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

export const getServerSideProps = i18nServerSideProps('/affiliate/payouts/[id]')
