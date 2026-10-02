import { useState, type FormEvent } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { ArrowRight } from 'lucide-react'
import { Footer } from '@/components/Footer'
import { metaLabel, primaryButton } from '@/components/landing-styles'
import { SiteNav } from '@/components/SiteNav'
import { formatTrialCode, normalizeTrialCode } from '@/lib/trial-code'

const CODE_LENGTH = 12

export default function RedeemPage() {
    const router = useRouter()
    const [value, setValue] = useState('')
    const [error, setError] = useState<string | null>(null)

    function submit(event: FormEvent) {
        event.preventDefault()
        const code = normalizeTrialCode(value)
        if (code.length !== CODE_LENGTH) {
            setError('Codes have 12 letters and numbers, like ABCD-EFGH-JKMN.')
            return
        }
        void router.push(`/redeem/${formatTrialCode(code)}`)
    }

    return (
        <>
            <Head>
                <title>Redeem a code - Enconvo</title>
                <meta name="description" content="Redeem an Enconvo license code or trial code." />
            </Head>
            <div className="min-h-screen bg-canvas text-content">
                <SiteNav />
                <main className="mx-auto max-w-[1240px] px-6 pb-24 pt-36 lg:px-12">
                    <p className={metaLabel}>Redeem</p>
                    <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl sm:leading-[1.1]">
                        Redeem a code
                    </h1>
                    <p className="mt-5 max-w-xl text-base leading-7 text-content-body">
                        Enter a license code for a lifetime Enconvo license, or a trial code for a free month of the Plus Cloud plan.
                    </p>
                    <form onSubmit={submit} className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row" noValidate>
                        <label htmlFor="trial-code" className="sr-only">
                            Code
                        </label>
                        <input
                            id="trial-code"
                            value={value}
                            onChange={(event) => {
                                setValue(event.target.value)
                                setError(null)
                            }}
                            placeholder="ABCD-EFGH-JKMN"
                            autoComplete="off"
                            autoCapitalize="characters"
                            spellCheck={false}
                            aria-invalid={!!error}
                            aria-describedby={error ? 'trial-code-error' : undefined}
                            className="min-h-[48px] flex-1 rounded-lg border border-hairline bg-surface-card px-4 font-mono text-base uppercase tracking-[0.12em] text-content placeholder:text-content-ash focus:border-hairline-strong focus:outline-none"
                        />
                        <button type="submit" className={primaryButton}>
                            Continue
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </form>
                    {error && (
                        <p id="trial-code-error" role="alert" className="mt-3 text-sm text-signal-yellow">
                            {error}
                        </p>
                    )}
                </main>
                <Footer />
            </div>
        </>
    )
}
