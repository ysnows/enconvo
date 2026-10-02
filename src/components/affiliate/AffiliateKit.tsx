import { Check, Download, X } from 'lucide-react'
import Link from 'next/link'
import { affiliateLink, SITE_ORIGIN } from '@/lib/affiliate-program'
import { card, CopyButton } from './ui'

// The promotion kit on the Affiliate dashboard: the app icon, share images and
// ready-to-copy text with the Affiliate's own link in it. The text sticks to
// what the homepage and llms.txt state, and leaves prices to the pricing page,
// so it can't promise anything the terms forbid or go stale when plans change.

const IMAGES = [
    { src: '/brand/enconvo-icon-512.png', file: 'enconvo-icon-512.png', name: 'App icon', size: '512 × 512 PNG', square: true },
    { src: '/og/enconvo-mac-agent-v1.jpg', file: 'enconvo-assistant-1200x630.jpg', name: 'Share image: assistant', size: '1200 × 630 JPG', square: false },
    { src: '/og/enconvo-use-cases-v1.jpg', file: 'enconvo-use-cases-1200x630.jpg', name: 'Share image: use cases', size: '1200 × 630 JPG', square: false },
] as const

function snippets(link: string) {
    return [
        {
            name: 'Short post',
            text: `Enconvo is a native AI assistant for Mac that works across your apps. Automate tasks, dictate, search your documents, and use cloud AI or local models. ${link}`,
        },
        {
            name: 'Description',
            text: [
                "Enconvo is a native AI assistant and agent for Mac. It works beside the apps you already use, with what's on your screen and the text you select as context, so you can ask it to organize files, write, research or run a task across apps.",
                'It comes with an App Sidebar, PopBar for selected text, system-wide dictation, live captions and meeting notes, and a knowledge base for your documents. Use cloud AI, your own API keys, or local models through MLX, Ollama or LM Studio.',
                'Enconvo runs on macOS 14 or later, on Apple Silicon and Intel Macs, and has a free tier.',
                link,
            ].join('\n\n'),
        },
        {
            name: 'Disclosure',
            text: 'I earn a commission if you buy Enconvo through my link, at no extra cost to you.',
        },
    ]
}

const DO = [
    'Describe Enconvo in your own words, from what you have tried.',
    'Say that you earn a commission, for example with the disclosure above.',
    `Send people to ${SITE_ORIGIN.replace(/^https?:\/\//, '')}/#pricing for current prices and plans.`,
]

const DONT = [
    'Bid on search ads for "Enconvo" or close variants.',
    'Change the logo, or suggest that Enconvo endorses you.',
    "Promise prices, discounts or deadlines that enconvo.com doesn't show.",
    'Buy through your own link.',
]

export function AffiliateKit({ code }: { code: string }) {
    const link = affiliateLink(code)
    return (
        <section className={`${card} p-6`} aria-labelledby="affiliate-kit">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <h2 id="affiliate-kit" className="text-lg font-semibold text-content">
                    Promotion kit
                </h2>
                <p className="text-sm text-content-muted">Images and text you can use. Your link is already in the text.</p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {IMAGES.map((image) => (
                    <figure key={image.src} className="overflow-hidden rounded-xl border border-hairline bg-[#0B0C0D]">
                        <div className="flex aspect-[1200/630] items-center justify-center overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element -- static files, shown at their own size */}
                            <img
                                src={image.src}
                                alt={image.name}
                                loading="lazy"
                                className={image.square ? 'h-3/4 w-auto' : 'h-full w-full object-cover'}
                            />
                        </div>
                        <figcaption className="flex items-center justify-between gap-3 border-t border-hairline px-3 py-2.5">
                            <div className="min-w-0">
                                <div className="truncate text-sm text-content">{image.name}</div>
                                <div className="text-xs text-content-muted">{image.size}</div>
                            </div>
                            <a
                                href={image.src}
                                download={image.file}
                                aria-label={`Download ${image.name}`}
                                className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-hairline bg-surface-elevated text-content transition-colors hover:border-hairline-strong hover:bg-white/[0.06]"
                            >
                                <Download className="h-4 w-4" aria-hidden="true" />
                            </a>
                        </figcaption>
                    </figure>
                ))}
            </div>

            <div className="mt-6 space-y-4">
                {snippets(link).map((snippet) => (
                    <div key={snippet.name} className="border-t border-hairline pt-4">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-medium text-content">{snippet.name}</h3>
                            <CopyButton text={snippet.text} label="Copy" />
                        </div>
                        <p className="mt-2 whitespace-pre-line break-words rounded-lg bg-[#141617] px-3 py-2.5 text-sm leading-6 text-content-body">
                            {snippet.text}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-6 grid gap-6 border-t border-hairline pt-5 sm:grid-cols-2">
                <div>
                    <h3 className="text-sm font-medium text-content">Do</h3>
                    <ul className="mt-2 space-y-2">
                        {DO.map((rule) => (
                            <li key={rule} className="flex gap-2 text-sm leading-6 text-content-body">
                                <Check className="mt-1 h-4 w-4 flex-none text-signal-green" aria-hidden="true" />
                                <span>{rule}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-content">Don&apos;t</h3>
                    <ul className="mt-2 space-y-2">
                        {DONT.map((rule) => (
                            <li key={rule} className="flex gap-2 text-sm leading-6 text-content-body">
                                <X className="mt-1 h-4 w-4 flex-none text-signal-red" aria-hidden="true" />
                                <span>{rule}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-content-muted">
                The{' '}
                <Link href="/affiliate/terms" className="text-signal-blue hover:underline">
                    program terms
                </Link>{' '}
                have the full rules.
            </p>
        </section>
    )
}
