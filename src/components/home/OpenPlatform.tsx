import { Container } from '@/components/Container'

const PILLARS = [
    {
        title: 'MCP Servers',
        body: 'Connect any Model Context Protocol server — HTTP, SSE, or stdio — and its tools are available everywhere.',
    },
    {
        title: '80+ Plugins',
        body: 'An open-source extension arsenal covering search, OCR, media, documents, and more. All on GitHub.',
    },
    {
        title: 'Skills',
        body: 'Teach the agent repeatable procedures. Install skills from the community or write your own.',
    },
    {
        title: 'Workflows',
        body: 'Chain tools, prompts, and conditions into one-hotkey automations with a visual editor.',
    },
]

export function OpenPlatform() {
    return (
        <section
            id="platform"
            aria-label="Open and extensible"
            className="bg-canvas py-20 sm:py-28"
        >
            <Container>
                <div className="mx-auto max-w-3xl text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-content-ash">
                        Open &amp; extensible
                    </p>
                    <h2 className="mt-3 font-display text-3xl tracking-tight text-content sm:text-4xl">
                        A platform, not a chatbox.
                    </h2>
                    <p className="mt-4 text-lg text-content-muted">
                        Everything the agent can do is a building block you can extend.
                    </p>
                </div>

                <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {PILLARS.map((pillar) => (
                        <div
                            key={pillar.title}
                            className="rounded-lg border border-hairline bg-surface-card p-6 transition-colors hover:border-hairline-strong"
                        >
                            <h3 className="font-display text-lg font-semibold text-content">
                                {pillar.title}
                            </h3>
                            <p className="mt-3 text-sm leading-relaxed text-content-muted">
                                {pillar.body}
                            </p>
                        </div>
                    ))}
                </div>
            </Container>
        </section>
    )
}
