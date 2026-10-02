import { useState, type FormEvent } from 'react'
import { Loader2, Pencil } from 'lucide-react'
import { saveAffiliateProfile, type AffiliateApplication, type ProfileInput } from '@/lib/affiliate-program'
import { card, fieldLabel, input, textarea, toolButton } from './ui'

// The Affiliate's profile on /affiliate: what it told us in its application, which it keeps
// current as its audience or channels change. Admins see each change in the account's history.

const saveButton =
    'inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-hairline bg-surface-elevated px-4 text-sm font-medium text-content transition-colors hover:border-hairline-strong hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50'

function profileOf(affiliate: AffiliateApplication): ProfileInput {
    return {
        name: affiliate.name ?? '',
        website: affiliate.website ?? '',
        audience: affiliate.audience ?? '',
        promotion_plan: affiliate.promotion_plan ?? '',
    }
}

/** The profile as the Worker keeps it: trimmed, with an empty website as none. */
const trimmed = (profile: ProfileInput): ProfileInput => ({
    name: profile.name.trim(),
    website: profile.website.trim(),
    audience: profile.audience.trim(),
    promotion_plan: profile.promotion_plan.trim(),
})

export function ProfileCard({
    affiliate,
    accessToken,
    onSaved,
}: {
    affiliate: AffiliateApplication
    accessToken: string
    onSaved: (affiliate: AffiliateApplication) => void
}) {
    const [draft, setDraft] = useState<ProfileInput | null>(null)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null)
    const saved = profileOf(affiliate)

    const change = (field: keyof ProfileInput, value: string) => {
        setDraft((current) => ({ ...(current ?? saved), [field]: value }))
        setMessage(null)
    }

    async function save(event: FormEvent) {
        event.preventDefault()
        if (!draft || saving) return
        const profile = trimmed(draft)
        if (!profile.name || !profile.audience || !profile.promotion_plan) return
        setSaving(true)
        setMessage(null)
        const result = await saveAffiliateProfile(accessToken, profile)
        setSaving(false)
        if (result.ok) {
            onSaved(result.data)
            setDraft(null)
            setMessage({ error: false, text: 'Saved.' })
        } else {
            setMessage({ error: true, text: result.message })
        }
    }

    if (!draft) {
        const rows = [
            { label: 'Name', value: saved.name },
            { label: 'Website or channel', value: saved.website },
            { label: 'Audience', value: saved.audience },
            { label: 'How you promote Enconvo', value: saved.promotion_plan },
        ]
        return (
            <section id="profile" className={`scroll-mt-28 ${card}`} aria-labelledby="affiliate-profile">
                <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-6">
                    <div>
                        <h2 id="affiliate-profile" className="text-lg font-semibold text-content">
                            Your profile
                        </h2>
                        <p className="mt-1 text-sm text-content-muted">
                            What you told us in your application. Keep it current as your channels change.
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
                        Edit profile
                    </button>
                </div>
                {message && (
                    <p role="status" className="px-6 pt-3 text-xs text-signal-green">
                        {message.text}
                    </p>
                )}
                <dl className="mt-4 divide-y divide-hairline border-t border-hairline">
                    {rows.map((row) => (
                        <div key={row.label} className="grid gap-1 px-6 py-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6">
                            <dt className="text-sm text-content-muted">{row.label}</dt>
                            <dd className={`whitespace-pre-line break-words text-sm leading-6 ${row.value ? 'text-content' : 'text-content-ash'}`}>
                                {row.value || 'Not added yet'}
                            </dd>
                        </div>
                    ))}
                </dl>
            </section>
        )
    }

    const profile = trimmed(draft)
    const unchanged = JSON.stringify(profile) === JSON.stringify(trimmed(saved))
    const complete = !!(profile.name && profile.audience && profile.promotion_plan)
    return (
        <form id="profile" onSubmit={save} className={`scroll-mt-28 ${card} space-y-5 p-6`} aria-labelledby="affiliate-profile" noValidate>
            <div>
                <h2 id="affiliate-profile" className="text-lg font-semibold text-content">
                    Your profile
                </h2>
                <p className="mt-1 text-sm text-content-muted">Your link and commission rate stay the same. We see each change you make.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                    <span className={fieldLabel}>Your name</span>
                    <input
                        className={`${input} mt-2`}
                        value={draft.name}
                        onChange={(e) => change('name', e.target.value)}
                        maxLength={100}
                        autoComplete="name"
                        required
                    />
                </label>
                <label className="block">
                    <span className={fieldLabel}>
                        Website or channel <span className="font-normal text-content-muted">(optional)</span>
                    </span>
                    <input
                        className={`${input} mt-2`}
                        value={draft.website}
                        onChange={(e) => change('website', e.target.value)}
                        maxLength={300}
                        placeholder="youtube.com/@yourchannel"
                        inputMode="url"
                    />
                </label>
            </div>
            <label className="block">
                <span className={fieldLabel}>Who is your audience?</span>
                <textarea
                    className={`${textarea} mt-2`}
                    value={draft.audience}
                    onChange={(e) => change('audience', e.target.value)}
                    maxLength={500}
                    placeholder="e.g. 40k newsletter subscribers who buy productivity apps"
                    required
                />
            </label>
            <label className="block">
                <span className={fieldLabel}>How do you promote Enconvo?</span>
                <textarea
                    className={`${textarea} mt-2`}
                    value={draft.promotion_plan}
                    onChange={(e) => change('promotion_plan', e.target.value)}
                    maxLength={2000}
                    placeholder="e.g. a review video, then a mention in my monthly tools roundup"
                    required
                />
            </label>
            <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={!complete || unchanged || saving} className={saveButton}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    Save profile
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
                    !complete && <span className="text-xs text-content-muted">Your name, audience and how you promote Enconvo are required.</span>
                )}
            </div>
        </form>
    )
}
