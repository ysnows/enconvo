export interface CloudModel {
    title: string;
    value: string;
    context: number;
    perRequestPrice: number;
    perRequestUnit: string;
    providerName: string;
    toolUse?: boolean;
    visionEnable?: boolean;
    systemMessageEnable?: boolean;
    searchToolSupported?: boolean;
    imageGeneration?: boolean;
    audioEnable?: boolean;
    maxTokens?: number;
    sequenceContentDisable?: boolean;
}

export const cloudModels: CloudModel[] = [
    {
        title: "GPT-5.1",
        value: "openai/gpt-5.1",
        context: 400000,
        perRequestPrice: 62500,
        perRequestUnit: "1M input tokens , 500,000 points / 1M output tokens",
        providerName: "openai",
        toolUse: true,
        visionEnable: true,
        systemMessageEnable: true,
        searchToolSupported: true,
        imageGeneration: true
    },
    {
        title: "GPT-5",
        value: "openai/gpt-5",
        context: 400000,
        perRequestPrice: 62500,
        perRequestUnit: "1M input tokens , 500,000 points / 1M output tokens",
        providerName: "openai",
        toolUse: true,
        visionEnable: true,
        systemMessageEnable: true,
        searchToolSupported: true,
        imageGeneration: true
    },
    {
        title: "GPT-5 mini",
        value: "openai/gpt-5-mini",
        context: 400000,
        perRequestPrice: 12500,
        perRequestUnit: "1M input tokens , 100,000 points / 1M output tokens",
        providerName: "openai",
        toolUse: true,
        visionEnable: true,
        systemMessageEnable: true,
        searchToolSupported: true,
        imageGeneration: true
    },
    {
        title: "GPT-5 nano",
        value: "openai/gpt-5-nano",
        context: 400000,
        perRequestPrice: 2500,
        perRequestUnit: "1M input tokens , 20,000 points / 1M output tokens",
        providerName: "openai",
        toolUse: true,
        visionEnable: true,
        systemMessageEnable: true,
        searchToolSupported: true,
        imageGeneration: true
    },
    {
        title: "GPT-5.1 chat latest",
        value: "openai/gpt-5.1-chat-latest",
        context: 400000,
        perRequestPrice: 62500,
        perRequestUnit: "1M input tokens , 500,000 points / 1M output tokens",
        providerName: "openai",
        toolUse: false,
        visionEnable: true,
        systemMessageEnable: true,
        searchToolSupported: true,
        imageGeneration: true
    },
    {
        title: "GPT-5 chat latest",
        value: "openai/gpt-5-chat-latest",
        context: 400000,
        perRequestPrice: 62500,
        perRequestUnit: "1M input tokens , 500,000 points / 1M output tokens",
        providerName: "openai",
        toolUse: false,
        visionEnable: true,
        systemMessageEnable: true,
        searchToolSupported: true,
        imageGeneration: true
    },
    {
        title: "GPT-4.1",
        value: "openai/gpt-4.1",
        context: 1047576,
        providerName: "openai",
        perRequestPrice: 100000,
        perRequestUnit: "1M input tokens , 400,000 points / 1M output tokens",
        toolUse: true,
        visionEnable: true,
        searchToolSupported: true,
        imageGeneration: true
    },
    {
        title: "GPT-4.1 mini",
        value: "openai/gpt-4.1-mini",
        context: 1047576,
        perRequestPrice: 20000,
        perRequestUnit: "1M input tokens , 80,000 points / 1M output tokens",
        providerName: "openai",
        toolUse: true,
        visionEnable: true,
        searchToolSupported: true,
        imageGeneration: true
    },
    {
        title: "GPT-4.1 nano",
        value: "openai/gpt-4.1-nano",
        context: 1047576,
        perRequestPrice: 5000,
        perRequestUnit: "1M input tokens , 20,000 points / 1M output tokens",
        providerName: "openai",
        toolUse: true,
        visionEnable: true,
        searchToolSupported: true,
        imageGeneration: true
    },
    {
        title: "Claude Sonnet 4.5",
        value: "anthropic/claude-sonnet-4-5-20250929",
        context: 200000,
        perRequestPrice: 150000,
        perRequestUnit: "1M input tokens , 750,000 points / 1M output tokens",
        providerName: "anthropic",
        toolUse: true,
        visionEnable: true,
        searchToolSupported: true,
        maxTokens: 64000
    },
    {
        title: "Claude Haiku 4.5",
        value: "anthropic/claude-haiku-4-5-20251001",
        context: 200000,
        perRequestPrice: 50000,
        perRequestUnit: "1M input tokens , 250,000 points / 1M output tokens",
        providerName: "anthropic",
        toolUse: true,
        visionEnable: true,
        searchToolSupported: true,
        maxTokens: 64000
    },
    {
        title: "Claude Opus 4.5",
        value: "anthropic/claude-opus-4-5-20251101",
        context: 200000,
        perRequestPrice: 250000,
        perRequestUnit: "1M input tokens , 1,250,000 points / 1M output tokens",
        providerName: "anthropic",
        toolUse: true,
        visionEnable: true,
        searchToolSupported: true,
        maxTokens: 32000
    },
    {
        title: "Claude Sonnet 4",
        value: "anthropic/claude-sonnet-4-20250514",
        context: 200000,
        perRequestPrice: 150000,
        perRequestUnit: "1M input tokens , 750,000 points / 1M output tokens",
        providerName: "anthropic",
        toolUse: true,
        visionEnable: true,
        searchToolSupported: true,
        maxTokens: 64000
    },
    {
        title: "Claude Opus 4.1",
        value: "anthropic/claude-opus-4-1-20250805",
        context: 200000,
        perRequestPrice: 750000,
        perRequestUnit: "1M input tokens , 3,750,000 points / 1M output tokens",
        providerName: "anthropic",
        toolUse: true,
        visionEnable: true,
        searchToolSupported: true,
        maxTokens: 32000
    },
    {
        title: "Claude Opus 4",
        value: "anthropic/claude-opus-4-20250514",
        context: 200000,
        perRequestPrice: 750000,
        perRequestUnit: "1M input tokens , 3,750,000 points / 1M output tokens",
        providerName: "anthropic",
        toolUse: true,
        visionEnable: true,
        searchToolSupported: true,
        maxTokens: 32000
    },
    {
        title: "Claude 3.7 Sonnet",
        value: "anthropic/claude-3-7-sonnet-latest",
        context: 200000,
        maxTokens: 64000,
        perRequestPrice: 150000,
        perRequestUnit: "1M input tokens , 750,000 points / 1M output tokens",
        providerName: "anthropic",
        toolUse: true,
        visionEnable: true,
        searchToolSupported: true
    },
    {
        title: "Claude 3.5 Sonnet",
        value: "anthropic/claude-3-5-sonnet-20240620",
        context: 200000,
        perRequestPrice: 150000,
        perRequestUnit: "1M input tokens , 750,000 points / 1M output tokens",
        providerName: "anthropic",
        toolUse: true,
        visionEnable: true,
        searchToolSupported: true
    },
    {
        title: "OpenAI GPT-OSS 120B (limited time free, until Sep 30)",
        value: "openai-oss/gpt-oss-120b",
        context: 131072,
        perRequestPrice: 0,
        perRequestUnit: "message",
        providerName: "openai-oss",
        toolUse: true,
        visionEnable: true,
        maxTokens: 32768
    },
    {
        title: "OpenAI GPT-OSS 20B (limited time free, until Sep 30)",
        value: "openai-oss/gpt-oss-20b",
        context: 131072,
        perRequestPrice: 0,
        perRequestUnit: "message",
        providerName: "openai-oss",
        toolUse: true,
        visionEnable: true,
        maxTokens: 32768
    },
    {
        title: "Gemini 3 Pro Preview",
        value: "google/gemini-3-pro-preview",
        context: 1048576,
        maxTokens: 65536,
        perRequestPrice: 100000,
        perRequestUnit: "1M input tokens , 600,000 points / 1M output tokens",
        providerName: "google",
        visionEnable: true,
        audioEnable: true,
        toolUse: true,
        searchToolSupported: true
    },
    {
        title: "Gemini 3 Pro Image Preview",
        value: "google/gemini-3-pro-image-preview",
        context: 32768,
        maxTokens: 32768,
        perRequestPrice: 100000,
        perRequestUnit: "1M input tokens , 600,000 points / 1M output tokens",
        providerName: "google",
        visionEnable: true,
        imageGeneration: true,
        audioEnable: false,
        toolUse: false
    },
    {
        title: "Gemini 2.5 Pro",
        value: "google/gemini-2.5-pro",
        context: 1048576,
        maxTokens: 65536,
        perRequestPrice: 62500,
        perRequestUnit: "1M input tokens , 500,000 points / 1M output tokens",
        providerName: "google",
        visionEnable: true,
        audioEnable: true,
        toolUse: true,
        searchToolSupported: true
    },
    {
        title: "Gemini 2.5 Flash",
        value: "google/gemini-2.5-flash",
        context: 1048576,
        maxTokens: 65536,
        perRequestPrice: 15000,
        perRequestUnit: "1M input tokens , 125,000 points / 1M output tokens",
        providerName: "google",
        visionEnable: true,
        audioEnable: true,
        toolUse: true,
        searchToolSupported: true
    },
    {
        title: "Gemini 2.5 Flash Lite(free)",
        value: "google/gemini-2.5-flash-lite",
        context: 1048576,
        maxTokens: 65536,
        perRequestPrice: 0,
        perRequestUnit: "message",
        providerName: "google",
        visionEnable: true,
        audioEnable: true,
        toolUse: true,
        searchToolSupported: true
    },
    {
        title: "Gemini 2.5 Flash Latest",
        value: "google/gemini-flash-latest",
        context: 1048576,
        maxTokens: 65536,
        perRequestPrice: 15000,
        perRequestUnit: "1M input tokens , 125,000 points / 1M output tokens",
        providerName: "google",
        visionEnable: true,
        audioEnable: true,
        toolUse: true,
        searchToolSupported: true
    },
    {
        title: "Gemini 2.5 Flash Lite Latest",
        value: "google/gemini-flash-lite-latest",
        context: 1048576,
        maxTokens: 65536,
        perRequestPrice: 5000,
        perRequestUnit: "1M input tokens , 20,000 points / 1M output tokens",
        providerName: "google",
        visionEnable: true,
        audioEnable: true,
        toolUse: true,
        searchToolSupported: true
    },
    {
        title: "Gemini 2.5 Flash Image Preview",
        value: "google/gemini-2.5-flash-image-preview",
        context: 32768,
        maxTokens: 32768,
        perRequestPrice: 15000,
        perRequestUnit: "1M input tokens , 125,000 points / 1M output tokens",
        providerName: "google",
        visionEnable: true,
        imageGeneration: true,
        audioEnable: false,
        toolUse: false
    },
    {
        title: "DeepSeek-V3.2-Exp(free)",
        value: "deepseek-ai/DeepSeek-V3.2-Exp",
        systemMessageEnable: false,
        sequenceContentDisable: true,
        providerName: "deepseek",
        context: 64000,
        perRequestPrice: 0,
        perRequestUnit: "message",
        toolUse: true
    },
    {
        title: "DeepSeek-V3.2-Exp-Thinking(free)",
        value: "deepseek-ai/DeepSeek-V3.2-Exp-Thinking",
        systemMessageEnable: false,
        sequenceContentDisable: true,
        providerName: "deepseek",
        context: 64000,
        perRequestPrice: 0,
        perRequestUnit: "message"
    },
    {
        title: "DeepSeek-R1-0528(free)",
        value: "deepseek-ai/DeepSeek-R1",
        systemMessageEnable: false,
        sequenceContentDisable: true,
        providerName: "deepseek",
        context: 64000,
        perRequestPrice: 0,
        perRequestUnit: "message"
    },
    {
        title: "DeepSeek-V3.1(free)",
        value: "deepseek-ai/DeepSeek-V3",
        toolUse: true,
        providerName: "deepseek",
        context: 64000,
        perRequestPrice: 0,
        perRequestUnit: "message"
    },
    {
        title: "Grok-4-1-fast-reasoning",
        value: "grok/grok-4-1-fast-reasoning",
        providerName: "grok",
        context: 2000000,
        perRequestPrice: 10000,
        perRequestUnit: "1M input tokens , 25,000 points / 1M output tokens",
        toolUse: true,
        visionEnable: true
    },
    {
        title: "Grok-4-1-fast-non-reasoning",
        value: "grok/grok-4-1-fast-non-reasoning",
        providerName: "grok",
        context: 2000000,
        perRequestPrice: 10000,
        perRequestUnit: "1M input tokens , 25,000 points / 1M output tokens",
        toolUse: true,
        visionEnable: true
    },
    {
        title: "Grok-4-fast",
        value: "grok/grok-4-fast",
        providerName: "grok",
        context: 2000000,
        perRequestPrice: 10000,
        perRequestUnit: "1M input tokens , 25,000 points / 1M output tokens",
        toolUse: true,
        visionEnable: true
    },
    {
        title: "Grok-4-fast-non-reasoning",
        value: "grok/grok-4-fast-non-reasoning",
        providerName: "grok",
        context: 2000000,
        perRequestPrice: 10000,
        perRequestUnit: "1M input tokens , 25,000 points / 1M output tokens",
        toolUse: true,
        visionEnable: true
    },
    {
        title: "Mistral Large",
        value: "mistral/mistral-large-latest",
        providerName: "mistral",
        context: 131000,
        perRequestPrice: 100000,
        perRequestUnit: "1M input tokens , 300,000 points / 1M output tokens",
        toolUse: true,
        visionEnable: false
    },
    {
        title: "Mistral Small (Free)",
        value: "mistral/mistral-small-latest",
        providerName: "mistral",
        context: 131000,
        perRequestPrice: 0,
        perRequestUnit: "message",
        toolUse: true,
        visionEnable: true
    }
];

// Group models by provider
export const groupedModels = cloudModels.reduce((acc, model) => {
    if (!acc[model.providerName]) {
        acc[model.providerName] = [];
    }
    acc[model.providerName].push(model);
    return acc;
}, {} as Record<string, CloudModel[]>);

// Provider display names
export const providerNames: Record<string, string> = {
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    'google': 'Google',
    'deepseek': 'DeepSeek',
    'grok': 'Grok',
    'mistral': 'Mistral',
    'openai-oss': 'OpenAI OSS'
};
