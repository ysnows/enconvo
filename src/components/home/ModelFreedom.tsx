import { Container } from '@/components/Container'

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

const CATEGORIES = ['Language models', 'Image', 'Video', 'Speech', 'Transcription']

const CLAIMS = [
    {
        title: 'Bring your own key — free forever',
        body: 'Plug in your own API keys and AI usage is never metered. No token caps, no run limits, on every tier.',
    },
    {
        title: 'Use the subscriptions you already pay for',
        body: 'Sign in with your existing ChatGPT, Claude, or Grok subscription and use it right inside Enconvo.',
    },
    {
        title: 'Cloud when easy, local when private',
        body: 'Skip the setup with Enconvo Cloud, or run MLX, Ollama, and LM Studio models fully offline on your Mac.',
    },
]

export function ModelFreedom() {
    return (
        <section
            id="models"
            aria-label="Model freedom"
            className="bg-canvas py-20 sm:py-28"
        >
            <Container>
                <div className="mx-auto max-w-3xl text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-content-ash">
                        Model freedom
                    </p>
                    <h2 className="mt-3 font-display text-3xl tracking-tight text-content sm:text-4xl">
                        Any AI. Your terms.
                    </h2>
                    <p className="mt-4 text-lg text-content-muted">
                        One app for every provider — language, image, video, speech, and
                        transcription — with nothing locked to a single vendor.
                    </p>
                </div>

                <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-2">
                    {PROVIDERS.map((name) => (
                        <span
                            key={name}
                            className="rounded-md border border-hairline bg-surface-card px-3 py-1.5 text-sm text-content-body"
                        >
                            {name}
                        </span>
                    ))}
                </div>
                <p className="mt-4 text-center text-xs uppercase tracking-[0.14em] text-content-ash">
                    {CATEGORIES.join('  ·  ')}
                </p>

                <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
                    {CLAIMS.map((claim) => (
                        <div
                            key={claim.title}
                            className="rounded-lg border border-hairline bg-surface-card p-6 transition-colors hover:border-hairline-strong"
                        >
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
