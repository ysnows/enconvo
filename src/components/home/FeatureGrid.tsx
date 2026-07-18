import Link from 'next/link'
import { Container } from '@/components/Container'
import { features } from '@/data/features'

// Long-tail capabilities not already shown in the Hero showcase or the
// mid-page sections. Titles must match src/data/features.tsx.
const GRID_TITLES = [
    'Agent Mode',
    'Writing Tools',
    'AI Web Search',
    'Image Generation',
    'Advanced Translation',
    'Live Screen & Camera',
    'Context Awareness',
    'Offline & Privacy Mode',
    'Online Video Downloader',
]

export function FeatureGrid() {
    const items = GRID_TITLES
        .map((title) => features.find((feature) => feature.title === title))
        .filter((feature): feature is NonNullable<typeof feature> => Boolean(feature))

    return (
        <section
            id="features"
            aria-label="More features"
            className="bg-canvas py-20 sm:py-28"
        >
            <Container>
                <div className="mx-auto max-w-3xl text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-content-ash">
                        And more
                    </p>
                    <h2 className="mt-3 font-display text-3xl tracking-tight text-content sm:text-4xl">
                        The rest of the toolbox.
                    </h2>
                    <p className="mt-4 text-lg text-content-muted">
                        100+ capabilities ship built in. A few highlights:
                    </p>
                </div>

                <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((feature) => {
                        const Icon = feature.icon
                        return (
                            <Link
                                key={feature.title}
                                href="/use-cases"
                                className="group flex items-start gap-4 rounded-lg border border-hairline bg-surface-card p-5 transition-colors hover:border-hairline-strong"
                            >
                                <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-md border border-hairline bg-surface-elevated text-content-muted group-hover:text-content">
                                    <Icon />
                                </span>
                                <span>
                                    <span className="block font-display text-base font-semibold text-content">
                                        {feature.title}
                                    </span>
                                    <span className="mt-1 line-clamp-2 text-sm leading-relaxed text-content-muted">
                                        {feature.description}
                                    </span>
                                </span>
                            </Link>
                        )
                    })}
                </div>

                <p className="mt-10 text-center">
                    <Link
                        href="/use-cases"
                        className="text-sm font-medium text-signal-blue transition hover:text-content"
                    >
                        Explore all use cases &rarr;
                    </Link>
                </p>
                <p className="mt-3 text-center text-sm text-content-ash">
                    All Enconvo extensions are open source on{' '}
                    <a
                        href="https://github.com/enconvo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-content-muted underline underline-offset-2 transition hover:text-content"
                    >
                        GitHub
                    </a>
                    .
                </p>
            </Container>
        </section>
    )
}
