import { Fragment, useEffect, useState } from 'react'
import { Megaphone, MessageSquare, X } from 'lucide-react'
import { formatDay, type AffiliateDashboard } from '@/lib/affiliate-program'
import { card } from './ui'

// The program's announcement on /affiliate, such as when this month's payouts go out, since the
// program sends Affiliates no email. Admins post it from the console; it's plain text with line
// breaks. Hiding it is remembered in this browser by its id, so an edit stays hidden and a newly
// posted announcement shows again.
//
// Enconvo's message to one Affiliate shows the same way, with its application or on its dashboard,
// and stays until an admin clears it, so it can't be hidden.

const HIDDEN = 'enconvo-affiliate-announcement-hidden'

function storage(): Storage | null {
    try {
        return window.localStorage
    } catch {
        return null
    }
}

/** Links to enconvo.com open in the same tab, others in a new one. */
const OWN_SITE = /^https:\/\/(www\.)?enconvo\.com([/?#]|$)/

/** The body's https links as links; punctuation that ends a sentence stays out of the link. */
export function linkedParts(body: string): ({ text: string } | { href: string })[] {
    const parts: ({ text: string } | { href: string })[] = []
    const pattern = /https:\/\/[^\s<>"']+/g
    let last = 0
    let match: RegExpExecArray | null
    while ((match = pattern.exec(body))) {
        const href = match[0].replace(/[.,;:!?)\]]+$/, '')
        const start = match.index
        if (href.length <= 'https://'.length) continue
        if (start > last) parts.push({ text: body.slice(last, start) })
        parts.push({ href })
        last = start + href.length
    }
    if (last < body.length) parts.push({ text: body.slice(last) })
    return parts
}

/** Plain text with its https links as links. */
export function LinkedText({ body }: { body: string }) {
    return (
        <>
            {linkedParts(body).map((part, index) =>
                'href' in part ? (
                    <a
                        key={index}
                        href={part.href}
                        {...(OWN_SITE.test(part.href) ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                        className="text-signal-blue hover:underline"
                    >
                        {part.href}
                    </a>
                ) : (
                    <Fragment key={index}>{part.text}</Fragment>
                )
            )}
        </>
    )
}

/** Enconvo's message to this Affiliate, if there is one. */
export function TeamMessage({ message }: { message: string | null | undefined }) {
    if (!message) return null
    return (
        <section className={`flex items-start gap-3 ${card} p-4`} aria-labelledby="affiliate-team-message">
            <MessageSquare className="mt-0.5 h-5 w-5 flex-none text-signal-blue" aria-hidden="true" />
            <div className="min-w-0 flex-1">
                <h2 id="affiliate-team-message" className="text-sm font-medium text-content">
                    A note from the Enconvo team
                </h2>
                <p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-content-body">
                    <LinkedText body={message} />
                </p>
            </div>
        </section>
    )
}

export function Announcement({ announcement }: { announcement: AffiliateDashboard['announcement'] }) {
    // Read after mounting, so nothing renders until we know whether it was hidden.
    const [hidden, setHidden] = useState<string | null | undefined>(undefined)
    useEffect(() => {
        try {
            setHidden(storage()?.getItem(HIDDEN) ?? null)
        } catch {
            setHidden(null)
        }
    }, [])
    if (!announcement || hidden === undefined || hidden === announcement.id) return null

    const hide = () => {
        try {
            storage()?.setItem(HIDDEN, announcement.id)
        } catch {
            // Storage is blocked: it's hidden until the page reloads.
        }
        setHidden(announcement.id)
    }
    const date = announcement.edited_at ? `Updated ${formatDay(announcement.edited_at)}` : formatDay(announcement.posted_at)
    return (
        <section className={`flex items-start gap-3 ${card} p-4`} aria-labelledby="affiliate-announcement">
            <Megaphone className="mt-0.5 h-5 w-5 flex-none text-signal-blue" aria-hidden="true" />
            <div className="min-w-0 flex-1">
                <h2 id="affiliate-announcement" className="text-sm font-medium text-content">
                    {announcement.title} <span className="whitespace-nowrap font-normal text-content-ash">· {date}</span>
                </h2>
                <p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-content-muted">
                    <LinkedText body={announcement.body} />
                </p>
            </div>
            <button
                type="button"
                onClick={hide}
                aria-label="Hide this announcement"
                title="Hide"
                className="-m-1.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg text-content-ash transition-colors hover:bg-white/[0.06] hover:text-content"
            >
                <X className="h-4 w-4" aria-hidden="true" />
            </button>
        </section>
    )
}
