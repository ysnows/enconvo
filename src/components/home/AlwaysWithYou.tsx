import { Container } from '@/components/Container'

export function AlwaysWithYou() {
    return (
        <section
            id="always-with-you"
            aria-label="Always with you"
            className="bg-canvas py-20 sm:py-28"
        >
            <Container>
                <div className="mx-auto max-w-3xl text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-content-ash">
                        Always with you
                    </p>
                    <h2 className="mt-3 font-display text-3xl tracking-tight text-content sm:text-4xl">
                        On your desktop. In your pocket.
                    </h2>
                </div>

                <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="rounded-lg border border-hairline bg-surface-card p-8 transition-colors hover:border-hairline-strong">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-signal-green">
                            Pet
                        </span>
                        <h3 className="mt-2 font-display text-xl font-semibold text-content">
                            A tiny companion that watches your agents work
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-content-muted">
                            A pixel-art pet lives on your desktop and mirrors what your
                            agents are doing — running, done, or waiting on you. Tap it to
                            jump straight to the session that needs attention. Compatible
                            with the open Codex pet-pack format, so community characters
                            just work.
                        </p>
                    </div>

                    <div className="rounded-lg border border-hairline bg-surface-card p-8 transition-colors hover:border-hairline-strong">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-signal-blue">
                            IM Channels
                        </span>
                        <h3 className="mt-2 font-display text-xl font-semibold text-content">
                            Command your Mac from anywhere
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-content-muted">
                            Away from your desk? Message your agent from Telegram, Discord,
                            Slack, or Feishu — it runs the task on your Mac and reports back
                            when it&apos;s done.
                        </p>
                    </div>
                </div>
            </Container>
        </section>
    )
}
