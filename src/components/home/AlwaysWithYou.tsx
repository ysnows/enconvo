import { CompanionVisual } from './SectionVisuals'
import styles from '@/styles/Home.module.css'
import { Container } from '@/components/Container'

export function AlwaysWithYou() {
    return (
        <section
            id="always-with-you"
            aria-label="Always with you"
            className={styles.section}
        >
            <Container className={styles.sectionContainer}>
                <div className={styles.sectionHeading} data-reveal>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-content-ash">
                        Always with you
                    </p>
                    <h2 className="font-display mt-3 text-3xl tracking-tight text-content sm:text-4xl">
                        On your desktop. In your pocket.
                    </h2>
                </div>

                <div
                    className={`${styles.cards} mx-auto mt-12 grid grid-cols-1 md:grid-cols-2`}
                >
                    <div
                        className={`${styles.card} ${styles.companionCard}`}
                        data-spotlight
                        data-reveal
                    >
                        <CompanionVisual kind="pet" />
                        <div className={styles.companionCopy}>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-signal-green">
                                Pet
                            </span>
                            <h3 className="font-display mt-2 text-xl font-semibold text-content">
                                A tiny companion that watches your agents work
                            </h3>
                            <p className="mt-3 text-sm leading-relaxed text-content-muted">
                                A pixel-art pet lives on your desktop and
                                mirrors what your agents are doing — running,
                                done, or waiting on you. Tap it to jump straight
                                to the session that needs attention. Compatible
                                with the open Codex pet-pack format, so
                                community characters just work.
                            </p>
                        </div>
                    </div>

                    <div
                        className={`${styles.card} ${styles.companionCard}`}
                        data-spotlight
                        data-reveal
                    >
                        <CompanionVisual kind="channels" />
                        <div className={styles.companionCopy}>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-signal-blue">
                                IM Channels
                            </span>
                            <h3 className="font-display mt-2 text-xl font-semibold text-content">
                                Command your Mac from anywhere
                            </h3>
                            <p className="mt-3 text-sm leading-relaxed text-content-muted">
                                Away from your desk? Message your agent from
                                Telegram, Discord, Slack, or Feishu — it runs
                                the task on your Mac and reports back when
                                it&apos;s done.
                            </p>
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    )
}
