import { PlatformVisual } from './SectionVisuals'
import styles from '@/styles/Home.module.css'
import { Plug, Puzzle, Sparkles, Workflow } from 'lucide-react'
import { Container } from '@/components/Container'

const PILLARS = [
    {
        icon: Plug,
        title: 'MCP Servers',
        body: 'Connect any Model Context Protocol server — HTTP, SSE, or stdio — and its tools are available everywhere.',
    },
    {
        icon: Puzzle,
        title: '80+ Plugins',
        body: 'An open-source extension arsenal covering search, OCR, media, documents, and more. All on GitHub.',
    },
    {
        icon: Sparkles,
        title: 'Skills',
        body: 'Teach the agent repeatable procedures. Install skills from the community or write your own.',
    },
    {
        icon: Workflow,
        title: 'Workflows',
        body: 'Chain tools, prompts, and conditions into one-hotkey automations with a visual editor.',
    },
]

export function OpenPlatform() {
    return (
        <section
            id="platform"
            aria-label="Open and extensible"
            className={styles.section}
        >
            <Container className={styles.sectionContainer}>
                <div
                    className={`${styles.sectionHeading} ${styles.sectionHeadingSplit}`}
                    data-reveal
                >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-content-ash">
                        Open &amp; extensible
                    </p>
                    <h2 className="font-display mt-3 text-3xl tracking-tight text-content sm:text-4xl">
                        A platform, not a chatbox.
                    </h2>
                    <p className="mt-4 text-lg text-content-muted">
                        Everything the agent can do is a building block you can
                        extend.
                    </p>
                </div>

                <div
                    className={`${styles.cards} mt-12 grid grid-cols-1 md:grid-cols-2`}
                >
                    {PILLARS.map((pillar, index) => (
                        <div
                            key={pillar.title}
                            className={`${styles.card} ${styles.platformCard}`}
                            data-spotlight
                            data-reveal
                        >
                            <PlatformVisual index={index} />
                            <div className={styles.platformCopy}>
                                <pillar.icon
                                    className={styles.cardIcon}
                                    aria-hidden="true"
                                />
                                <h3 className="font-display text-lg font-semibold text-content">
                                    {pillar.title}
                                </h3>
                                <p className="mt-3 text-sm leading-relaxed text-content-muted">
                                    {pillar.body}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </Container>
        </section>
    )
}
