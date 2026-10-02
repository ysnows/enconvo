import { useEffect, useState } from 'react'
import { Mail, Share2 } from 'lucide-react'
import { affiliateLink } from '@/lib/affiliate-program'
import { toolButton } from './ui'

// One-click sharing in the promotion kit. Each button opens a post with the kit's short post and
// the disclosure, and tags the link with the network as its sub ID, so the link results show which
// network brings customers. Only networks that keep the link exactly as written are offered:
// Facebook and LinkedIn credit a share to the page's canonical URL (og:url), which has no `?via=`.

const NETWORKS = [
    { sub: 'x', label: 'X', url: (text: string) => `https://x.com/intent/post?text=${encodeURIComponent(text)}` },
    { sub: 'threads', label: 'Threads', url: (text: string) => `https://www.threads.com/intent/post?text=${encodeURIComponent(text)}` },
    { sub: 'bluesky', label: 'Bluesky', url: (text: string) => `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}` },
] as const

const SUBJECT = 'Enconvo, an AI assistant for Mac'

export function ShareButtons({ code, post, disclosure }: { code: string; post: (link: string) => string; disclosure: string }) {
    const text = (sub: string) => `${post(affiliateLink(code, '/', sub))}\n\n${disclosure}`
    // The share sheet exists only in some browsers, so it's offered after mounting to keep the first render the same as the server's.
    const [canShare, setCanShare] = useState(false)
    useEffect(() => setCanShare(typeof navigator.share === 'function'), [])

    return (
        <div className="mt-6 border-t border-hairline pt-4">
            <h3 className="text-sm font-medium text-content">Share</h3>
            <p className="mt-1 text-xs leading-5 text-content-muted">
                Opens a post with the short post above and the disclosure. Each button tags your link with a sub ID such as{' '}
                <span className="font-mono text-content-body">x</span>, so your results show which network brings customers.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
                {NETWORKS.map((network) => (
                    <a key={network.sub} href={network.url(text(network.sub))} target="_blank" rel="noopener noreferrer" className={toolButton}>
                        {network.label}
                    </a>
                ))}
                <a href={`mailto:?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(text('email'))}`} className={toolButton}>
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    Email
                </a>
                {canShare && (
                    <button
                        type="button"
                        onClick={() => {
                            // Closing the share sheet rejects the promise; there's nothing to report.
                            navigator.share({ title: SUBJECT, text: text('share') }).catch(() => {})
                        }}
                        className={toolButton}
                    >
                        <Share2 className="h-4 w-4" aria-hidden="true" />
                        More
                    </button>
                )}
            </div>
        </div>
    )
}
