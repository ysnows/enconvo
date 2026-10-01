import Link from 'next/link'
import { Smartphone } from 'lucide-react'
import { CompanionVisual } from './SectionVisuals'
import styles from '@/styles/Home.module.css'
import { Container } from '@/components/Container'
import {
    IPHONE_APP_QR,
    IPHONE_APP_SECTION_ID,
    IPHONE_APP_TESTFLIGHT_URL,
} from '@/data/iphoneApp'
import { trackEvent } from '@/lib/analytics'

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
                        On your desktop. In your pocket.
                    </p>
                    <h2 className="font-display mt-3 text-3xl tracking-tight text-content sm:text-4xl">
                        Track your agents on the desktop and command your Mac from Telegram, Discord or Slack
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

                    <div
                        id={IPHONE_APP_SECTION_ID}
                        className={`${styles.card} ${styles.iphoneCard} md:col-span-2`}
                        data-spotlight
                        data-reveal
                    >
                        <div className={styles.iphoneCopy}>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-signal-yellow">
                                iPhone app · Beta
                            </span>
                            <h3 className="font-display mt-2 text-xl font-semibold text-content">
                                Your Mac&apos;s chats, in your pocket
                            </h3>
                            <p className="mt-3 text-sm leading-relaxed text-content-muted">
                                Pair the Enconvo iPhone app with your Mac to
                                reach its projects and chats from anywhere.
                                Every chat keeps running on your Mac, and
                                messages are end-to-end encrypted.
                            </p>
                            <div className={styles.iphoneActions}>
                                <a
                                    href={IPHONE_APP_TESTFLIGHT_URL}
                                    onClick={() =>
                                        trackEvent('iphone_app_click', {
                                            placement: 'always_with_you',
                                        })
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className={styles.iphoneButton}
                                >
                                    <Smartphone aria-hidden="true" />
                                    Join the TestFlight beta
                                </a>
                                <Link
                                    href="/use-cases#pair-your-iphone"
                                    className={styles.iphoneSecondaryLink}
                                >
                                    See how pairing works
                                    <span aria-hidden="true">→</span>
                                </Link>
                            </div>
                        </div>

                        <figure className={styles.iphoneQr}>
                            <svg
                                viewBox={`0 0 ${IPHONE_APP_QR.size} ${IPHONE_APP_QR.size}`}
                                shapeRendering="crispEdges"
                                role="img"
                                aria-label="QR code for the Enconvo iPhone beta on TestFlight"
                            >
                                <rect
                                    width={IPHONE_APP_QR.size}
                                    height={IPHONE_APP_QR.size}
                                    fill="#fff"
                                />
                                <path d={IPHONE_APP_QR.path} fill="#07080a" />
                            </svg>
                            <figcaption>Scan with your iPhone camera</figcaption>
                        </figure>
                    </div>
                </div>
            </Container>
        </section>
    )
}
