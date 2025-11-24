import { Container } from '@/components/Container';
import { groupedModels, providerNames, CloudModel } from '@/data/cloudModels';
import Link from 'next/link';
import Image from 'next/image';

// Import provider logos
import openaiLogo from '@/images/llm/openai.png';
import anthropicLogo from '@/images/llm/anthropic.png';
import googleLogo from '@/images/llm/google.jpg';
import deepseekLogo from '@/images/llm/deepseek.png';
import grokLogo from '@/images/llm/x.png';
import mistralLogo from '@/images/llm/mistral.jpg';

function FeatureBadge({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'success' }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variant === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'
            }`}>
            {children}
        </span>
    );
}

function ModelCard({ model }: { model: CloudModel }) {
    const isFree = model.perRequestPrice === 0;

    // Parse pricing info
    const parsePrice = (unit: string, inputPrice: number) => {
        if (unit === 'message' || inputPrice === 0) {
            return {
                input: 'Free',
                output: 'Free'
            };
        }

        // Extract output price from perRequestUnit
        // Format: "1M input tokens , 500,000 points / 1M output tokens"
        const match = unit.match(/,\s*([0-9,]+)\s*points/);
        const outputPrice = match ? match[1].replace(/,/g, '') : '';

        return {
            input: `${inputPrice.toLocaleString()} points / 1M tokens`,
            output: outputPrice ? `${parseInt(outputPrice).toLocaleString()} points / 1M tokens` : 'N/A'
        };
    };

    const pricing = parsePrice(model.perRequestUnit, model.perRequestPrice);

    return (
        <div className="group relative bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-gray-600/50 hover:shadow-xl hover:shadow-gray-900/20 transition-all duration-300">
            {/* Free badge */}
            {isFree && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    FREE
                </div>
            )}

            {/* Model name */}
            <h3 className="text-lg font-bold text-white mb-4">{model.title}</h3>

            {/* Specs */}
            <div className="space-y-2.5 mb-4">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Context</span>
                    <span className="text-white font-medium">{model.context.toLocaleString()} tokens</span>
                </div>
                {model.maxTokens && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Max Output</span>
                        <span className="text-white font-medium">{model.maxTokens.toLocaleString()} tokens</span>
                    </div>
                )}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Input Price</span>
                    <span className={`font-medium ${isFree ? 'text-green-400' : 'text-blue-400'}`}>
                        {pricing.input}
                    </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Output Price</span>
                    <span className={`font-medium ${isFree ? 'text-green-400' : 'text-blue-400'}`}>
                        {pricing.output}
                    </span>
                </div>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-2">
                {model.toolUse && <FeatureBadge>Tool Use</FeatureBadge>}
                {model.visionEnable && <FeatureBadge>Vision</FeatureBadge>}
                {model.audioEnable && <FeatureBadge>Audio</FeatureBadge>}
                {model.imageGeneration && <FeatureBadge>Image Gen</FeatureBadge>}
                {model.searchToolSupported && <FeatureBadge>Search</FeatureBadge>}
            </div>
        </div>
    );
}

function ProviderSection({ providerKey, models }: { providerKey: string, models: CloudModel[] }) {
    const providerName = providerNames[providerKey] || providerKey;

    // Provider logo mapping
    const providerLogos: Record<string, any> = {
        'openai': openaiLogo,
        'anthropic': anthropicLogo,
        'google': googleLogo,
        'deepseek': deepseekLogo,
        'grok': grokLogo,
        'mistral': mistralLogo,
        'openai-oss': openaiLogo
    };

    const logo = providerLogos[providerKey];

    return (
        <div className="mb-16">
            {/* Provider header */}
            <div className="flex items-center gap-4 mb-8">
                {logo ? (
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                        <Image
                            src={logo}
                            alt={providerName}
                            width={40}
                            height={40}
                            className="object-contain"
                        />
                    </div>
                ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">{providerName[0]}</span>
                    </div>
                )}
                <div>
                    <h2 className="text-3xl font-bold text-white">{providerName}</h2>
                    <p className="text-gray-400 text-sm">{models.length} model{models.length > 1 ? 's' : ''} available</p>
                </div>
            </div>

            {/* Models grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {models.map((model) => (
                    <ModelCard key={model.value} model={model} />
                ))}
            </div>
        </div>
    );
}

export default function CloudPlanPage() {
    const providers = Object.keys(groupedModels).sort();

    return (
        <div className="bg-gray-900 min-h-screen">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800/50">
                <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
                    <div className="flex lg:flex-1 items-center">
                        <Link href="/" className="flex items-center gap-3 text-white font-bold text-lg hover:text-blue-400 transition-colors">
                            ← Back to Home
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Main content */}
            <div className="pt-20">
                <Container>
                    {/* Page header */}
                    <div className="text-center py-16">
                        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
                            EnConvo Cloud Plan
                        </h1>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
                            Access powerful AI models without managing your own API keys. Pay only for what you use with our point-based system.
                        </p>

                        {/* Pricing info */}
                        <div className="inline-flex items-center gap-4 px-6 py-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <div className="text-left">
                                <div className="text-sm text-gray-400">Cloud Premium Plan</div>
                                <div className="text-2xl font-bold text-white">500,000 Points/Month</div>
                            </div>
                            <div className="h-12 w-px bg-gray-700"></div>
                            <div className="text-left">
                                <div className="text-sm text-gray-400">Starting at</div>
                                <div className="text-2xl font-bold text-blue-400">$10/month</div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Link
                                href="/#pricing"
                                className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors duration-200"
                            >
                                Get Started
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        </div>
                    </div>

                    {/* Provider sections */}
                    <div className="py-8">
                        {providers.map((providerKey) => (
                            <ProviderSection
                                key={providerKey}
                                providerKey={providerKey}
                                models={groupedModels[providerKey]}
                            />
                        ))}
                    </div>

                    {/* Footer CTA */}
                    <div className="text-center py-16 border-t border-gray-800">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Ready to get started?
                        </h2>
                        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                            Subscribe to Cloud Premium and get access to all these models without managing API keys.
                        </p>
                        <Link
                            href="/#pricing"
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200"
                        >
                            View Pricing Plans
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    </div>
                </Container>
            </div>
        </div>
    );
}
