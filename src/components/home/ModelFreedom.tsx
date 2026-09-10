import Image from 'next/image'
import type { StaticImageData } from 'next/image'
import { Cpu, Waves } from 'lucide-react'
import styles from '@/styles/Home.module.css'
import { KeyRound, Laptop, Layers } from 'lucide-react'
import { Container } from '@/components/Container'

import provider0 from '@/images/llm/openai.png'
import provider1 from '@/images/llm/anthropic.png'
import provider2 from '@/images/llm/google.jpg'
import provider3 from '@/images/llm/x.png'
import provider4 from '@/images/llm/deepseek.png'
import provider5 from '@/images/llm/moonshot.png'
import provider6 from '@/images/llm/mistral.jpg'
import provider7 from '@/images/llm/openrouter.png'
import provider8 from '@/images/llm/azure.png'
import provider9 from '@/images/llm/groq.png'
import provider10 from '@/images/llm/together.png'
import provider11 from '@/images/llm/fireworks.jpg'
import provider12 from '@/images/llm/ollama.png'
import provider13 from '@/images/llm/lm_studio.png'

const PROVIDER_LOGOS: Record<string, StaticImageData> = {
    OpenAI: provider0,
    Anthropic: provider1,
    'Google Gemini': provider2,
    'xAI Grok': provider3,
    DeepSeek: provider4,
    Moonshot: provider5,
    Mistral: provider6,
    OpenRouter: provider7,
    'Azure OpenAI': provider8,
    Groq: provider9,
    'Together AI': provider10,
    Fireworks: provider11,
    Ollama: provider12,
    'LM Studio': provider13,
}

const PROVIDERS = [
    'OpenAI',
    'Anthropic',
    'Google Gemini',
    'xAI Grok',
    'DeepSeek',
    'MiniMax',
    'Moonshot',
    'Mistral',
    'OpenRouter',
    'Azure OpenAI',
    'Groq',
    'Together AI',
    'Fireworks',
    'Ollama',
    'LM Studio',
    'MLX (on-device)',
]

const CATEGORIES = [
    'Language models',
    'Image',
    'Video',
    'Speech',
    'Transcription',
]

const CLAIMS = [
    {
        icon: KeyRound,
        title: 'Bring your own key — free forever',
        body: 'Plug in your own API keys and AI usage is never metered. No token caps, no run limits, on every tier.',
    },
    {
        icon: Layers,
        title: 'Use the subscriptions you already pay for',
        body: 'Sign in with your existing ChatGPT, Claude, or Grok subscription and use it right inside Enconvo.',
    },
    {
        icon: Laptop,
        title: 'Cloud when easy, local when private',
        body: 'Skip the setup with Enconvo Cloud, or run MLX, Ollama, and LM Studio models fully offline on your Mac.',
    },
]

export function ModelFreedom() {
    return (
        <section
            id="models"
            aria-label="Model freedom"
            className={styles.section}
        >
            <Container className={styles.sectionContainer}>
                <div className={styles.modelOverview}>
                    <div
                        className={`${styles.sectionHeading} ${styles.modelHeading}`}
                        data-reveal
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-content-ash">
                            Model freedom
                        </p>
                        <h2 className="font-display mt-3 text-3xl tracking-tight text-content sm:text-4xl">
                            Any AI. Your terms.
                        </h2>
                        <p className="mt-4 text-lg text-content-muted">
                            One app for every provider — language, image, video,
                            speech, and transcription — with nothing locked to a
                            single vendor.
                        </p>
                    </div>

                    <div data-reveal>
                        <div className={styles.providers}>
                            {PROVIDERS.map((name) => (
                                <span
                                    key={name}
                                    className="rounded-md border border-hairline bg-surface-card px-3 py-1.5 text-sm text-content-body"
                                >
                                    <span
                                        className={styles.providerLogo}
                                        aria-hidden="true"
                                    >
                                        {PROVIDER_LOGOS[name] ? (
                                            <Image
                                                src={PROVIDER_LOGOS[name]}
                                                alt=""
                                                width={22}
                                                height={22}
                                            />
                                        ) : name === 'MiniMax' ? (
                                            <Waves />
                                        ) : (
                                            <Cpu />
                                        )}
                                    </span>
                                    {name}
                                </span>
                            ))}
                        </div>
                        <p
                            className={`${styles.providerCategories} mt-4 text-center uppercase`}
                        >
                            {CATEGORIES.join('  ·  ')}
                        </p>
                    </div>
                </div>

                <div
                    className={`${styles.cards} ${styles.modelClaims} mx-auto mt-12 grid grid-cols-1 md:grid-cols-3`}
                    data-reveal
                >
                    {CLAIMS.map((claim) => (
                        <div
                            key={claim.title}
                            className={`${styles.card} p-6`}
                            data-spotlight
                        >
                            <claim.icon
                                className={styles.cardIcon}
                                aria-hidden="true"
                            />
                            <h3 className="font-display text-lg font-semibold text-content">
                                {claim.title}
                            </h3>
                            <p className="mt-3 text-sm leading-relaxed text-content-muted">
                                {claim.body}
                            </p>
                        </div>
                    ))}
                </div>
            </Container>
        </section>
    )
}
