import { useState, type FormEvent } from 'react'
import { Loader2, Pencil } from 'lucide-react'
import { BILLING_MAX_LENGTH, BILLING_MAX_LINES, saveBillingDetails, type AffiliateApplication } from '@/lib/affiliate-program'
import { card, fieldLabel, textarea, toolButton } from './ui'

// The Affiliate's billing details on /affiliate (ADR 0090): the company or legal name, address
// and tax ID it needs on its payout statements for its own accounts. Each payout keeps the details
// it was recorded with, so a change shows on later statements and earlier ones stay as they were.

const saveButton =
    'inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-hairline bg-surface-elevated px-4 text-sm font-medium text-content transition-colors hover:border-hairline-strong hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50'

const PLACEHOLDER = 'KenMoo Tools LTD\n12 Example Street\nLondon EC1A 1AA, United Kingdom\nVAT GB123456789'

/** The details as the Worker keeps them: each line trimmed, no blank lines around them or two in a row. */
export function tidyBillingDetails(value: string): string {
    const lines = value.split(/\r\n|\r|\n/).map((line) => line.replace(/\s+/g, ' ').trim())
    return lines
        .filter((line, i) => line || (i > 0 && lines[i - 1]))
        .join('\n')
        .trim()
}

export function BillingDetails({
    affiliate,
    accessToken,
    onSaved,
}: {
    affiliate: AffiliateApplication
    accessToken: string
    onSaved: (affiliate: AffiliateApplication) => void
}) {
    const [draft, setDraft] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null)
    // A Worker from before billing details doesn't send them, and can't save them either.
    if (affiliate.billing_details === undefined) return null
    const saved = affiliate.billing_details ?? ''

    async function save(event: FormEvent) {
        event.preventDefault()
        if (draft === null || saving) return
        setSaving(true)
        setMessage(null)
        const result = await saveBillingDetails(accessToken, tidyBillingDetails(draft))
        setSaving(false)
        if (result.ok) {
            onSaved(result.data)
            setDraft(null)
            setMessage({ error: false, text: result.data.billing_details ? 'Saved. Your next payout statement shows them.' : 'Removed.' })
        } else {
            setMessage({ error: true, text: result.message })
        }
    }

    const heading = (
        <h2 id="billing-details" className="text-lg font-semibold text-content">
            Billing details
        </h2>
    )

    if (draft === null) {
        return (
            <section id="billing" className={`scroll-mt-28 ${card}`} aria-labelledby="billing-details">
                <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-6">
                    <div>
                        {heading}
                        <p className="mt-1 text-sm text-content-muted">
                            The name, address and tax ID your payout statements show, if you need them for your accounts.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setDraft(saved)
                            setMessage(null)
                        }}
                        className={toolButton}
                    >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        {saved ? 'Edit details' : 'Add details'}
                    </button>
                </div>
                {message && (
                    <p role="status" className="px-6 pt-3 text-xs text-signal-green">
                        {message.text}
                    </p>
                )}
                <div className="mt-4 border-t border-hairline px-6 py-4">
                    <p className={`whitespace-pre-line break-words text-sm leading-6 ${saved ? 'text-content' : 'text-content-ash'}`}>
                        {saved || 'Not added yet. Your statements show your name and link code.'}
                    </p>
                </div>
            </section>
        )
    }

    const next = tidyBillingDetails(draft)
    const lines = next ? next.split('\n').length : 0
    const tooMany = lines > BILLING_MAX_LINES
    const unchanged = next === saved
    return (
        <form id="billing" onSubmit={save} className={`scroll-mt-28 ${card} space-y-5 p-6`} aria-labelledby="billing-details" noValidate>
            <div>
                {heading}
                <p className="mt-1 text-sm text-content-muted">
                    Statements of payouts from now on show these details. Earlier statements keep the ones they were made with.
                </p>
            </div>
            <label className="block">
                <span className={fieldLabel}>
                    Name, address and tax ID <span className="font-normal text-content-muted">(up to {BILLING_MAX_LINES} lines)</span>
                </span>
                <textarea
                    className={`${textarea} mt-2 min-h-[140px]`}
                    value={draft}
                    onChange={(e) => {
                        setDraft(e.target.value)
                        setMessage(null)
                    }}
                    maxLength={BILLING_MAX_LENGTH}
                    rows={5}
                    placeholder={PLACEHOLDER}
                    autoComplete="off"
                    aria-invalid={tooMany}
                    aria-describedby="billing-details-hint"
                />
            </label>
            <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={unchanged || tooMany || saving} className={saveButton}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    {next || !saved ? 'Save details' : 'Remove details'}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setDraft(null)
                        setMessage(null)
                    }}
                    disabled={saving}
                    className="min-h-[40px] rounded-lg px-3 text-sm font-medium text-content-muted transition-colors hover:text-content disabled:opacity-50"
                >
                    Cancel
                </button>
                {message ? (
                    <span role="status" className={`text-xs ${message.error ? 'text-signal-red' : 'text-signal-green'}`}>
                        {message.text}
                    </span>
                ) : (
                    <span id="billing-details-hint" className={`text-xs ${tooMany ? 'text-signal-red' : 'text-content-muted'}`}>
                        {tooMany
                            ? `${lines} lines; keep it to ${BILLING_MAX_LINES}.`
                            : `${next.length} of ${BILLING_MAX_LENGTH} characters. Leave it empty to show your name instead.`}
                    </span>
                )}
            </div>
        </form>
    )
}
