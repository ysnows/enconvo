import { Component1Icon, EyeOpenIcon, FileTextIcon, ImageIcon, MixIcon, CardStackIcon } from "@radix-ui/react-icons"

export const features = [
    {
        title: 'SmartBar',
        description: 'A unified entry point for all functionalities. Access AI features and 100+ plugins seamlessly from any application across the who system, streamlining your workflow with a simple @ command.',
        icon: () => (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
        ),
        gradient: 'from-purple-600 to-indigo-400',
        media: 'https://file.enconvo.com/usecases/smartbar.mp4',
        mediaType: 'video'
    },
    {
        title: 'Knowledge Base',
        description: 'Create and manage your knowledge base from various sources including documents and websites. Leverage AI-powered vector search to quickly find answers based on your curated knowledge.',
        icon: CardStackIcon,
        gradient: 'from-emerald-600 to-sky-400',
        media: 'https://file.enconvo.com/usecases/knowledge_base.mp4',
        mediaType: 'video',
    },
    {
        title: 'PopBar',
        description: 'Display a toolbar for selected text, providing quick access to 100+ features and plugins to efficiently complete your tasks. Customize the tools shown in PopBar and their order to suit your workflow.',
        icon: Component1Icon,
        gradient: 'from-yellow-800 to-cyan-300',
        media: 'https://file.enconvo.com/usecases/popbar.mp4',
        mediaType: 'video',
    },
    {
        title: 'Workflow',
        description: 'Create custom workflows by combining and arranging all system features, tools, and workflows to suit your specific needs. Easily access your personalized workflows across the entire system using SmartBar, PopBar, or hotkeys for maximum efficiency.',
        icon: MixIcon,
        gradient: 'from-orange-500 to-pink-500',
        media: 'https://file.enconvo.com/usecases/workflow.mp4',
        mediaType: 'video',
    },
    {
        title: 'Context Awareness',
        description: 'Automatically detect and utilize contextual information when invoking SmartBar, PopBar, or hotkeys. This includes currently active applications, selected text, Finder-selected files, and open web pages, which can be used to provide context for the next features to be invoked. The system can recommend relevant tools and plugins based on this context, streamlining your workflow and enhancing productivity.',
        icon: EyeOpenIcon,
        gradient: 'from-teal-400 to-blue-500',
        media: 'https://file.enconvo.com/usecases/context_awareness.mp4',
        mediaType: 'video'
    },
    {
        title: 'Voice Input Method',
        description: 'Seamlessly integrate voice input across your entire system. Activate voice input globally with customizable hotkeys, use press-and-hold shortcuts for quick transcription, and set up AI-powered post-processing workflows. Choose from multiple speech recognition providers including Microsoft, AssemblyAI, Deepgram, Groq, and local Whisper models for optimal flexibility and performance.',
        icon: () => (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
        ),
        gradient: 'from-red-500 to-orange-300',
        media: 'https://www.youtube.com/watch?v=SB-zzuQY9eU',
        mediaType: 'youtube'
    },
    {
        title: 'Writing Tools',
        description: 'Enhance your writing with our carefully crafted suite of tools designed to streamline your workflow. From fixing spelling and grammar to translating, improving, summarizing, and expanding your text, our comprehensive set of writing assistants helps you efficiently complete any writing task with professional-grade results.',
        icon: () => (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
        ),
        gradient: 'from-blue-500 to-green-400',
        media: 'https://file.enconvo.com/usecases/writing_tools.mp4',
        mediaType: 'video'
    },
    {
        title: 'Live Screen & Camera',
        description: 'Enhance your AI interactions with real-time visual context. Share your current screen content or camera feed directly with AI to receive instant, tailored assistance for any task at hand. This feature bridges the gap between visual information and AI understanding, enabling more accurate and contextually relevant support for your work.',
        icon: () => (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
            </svg>
        ),
        gradient: 'from-purple-500 to-indigo-500',
        media: 'https://file.enconvo.com/usecases/live_screen_camera.mp4',
        mediaType: 'video'
    },
    {
        title: 'AI Web Search',
        description: 'Combine AI with web search to expand real-time content sources for AI, eliminating tedious browsing and directly reaching final answers. Supports customization of multiple search providers, including Google, Bing, Tavily, SerpAPI, You Search, and Exa Search, enhancing the depth and breadth of information retrieval.',
        icon: () => (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
        ),
        gradient: 'from-blue-500 to-purple-500',
        media: 'https://file.enconvo.com/usecases/ai_web_search.mp4',
        mediaType: 'video'
    },
    {
        title: 'Live Closed Captions',
        description: 'Enable system-wide speech recognition for real-time closed captions. Simultaneously translate recognized captions, providing instant multilingual support for any audio content across your entire system. Enhance accessibility and break language barriers effortlessly.',
        icon: () => (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
        ),
        gradient: 'from-green-500 to-teal-400',
        media: 'https://file.enconvo.com/usecases/live_captions.mp4',
        mediaType: 'video'
    },
    {
        title: 'Image Generation',
        description: 'Rapidly create images using AI. Supports multiple image generation providers, including Stability Diffusion, OpenAI, and Flux, offering versatile options for your creative needs.',
        icon: ImageIcon,
        gradient: 'from-violet-600 to-emerald-200',
        media: 'https://file.enconvo.com/usecases/image_generation.mp4',
        mediaType: 'video'
    },
    {
        title: 'Chat with Documents',
        description: 'Engage in rapid Q&A with various document types including PDF, DOC, XLS, PPT, TXT, JSON, MD, and EPUB. No file size limitations.',
        icon: FileTextIcon,
        gradient: 'from-amber-500 to-pink-500',
        media: 'https://file.enconvo.com/usecases/chat_with_documents.mp4',
        mediaType: 'video'
    },
    {
        title: 'Offline & Privacy Mode',
        description: 'Empower your workflow with AI using offline models, ensuring all data remains on your local machine for maximum privacy. Supports providers like Ollama and LM Studio, allowing you to leverage AI capabilities without compromising sensitive information.',
        icon: () => (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
        ),
        gradient: 'from-slate-700 to-zinc-300',
        media: 'https://file.enconvo.com/usecases/offline_privacy_mode.mp4',
        mediaType: 'video'
    },
    {
        title: 'Advanced Translation',
        description: 'Streamline your translation workflow with instant access via SmartBar, PopBar, or keyboard shortcuts. Leverage multiple providers including DeepL, Google Translate, and AI-powered translation for comprehensive language support.',
        icon: MixIcon,
        gradient: 'from-blue-600 to-purple-400',
        media: 'https://file.enconvo.com/usecases/advanced_translation.mp4',
        mediaType: 'video'
    },
    {
        title: 'Extension System',
        description: 'Access an AI arsenal with 100+ diverse plugins usable in any application. Future updates will include plugin development capabilities, allowing you to customize functionalities freely.',
        icon: CardStackIcon,
        gradient: 'from-indigo-600 to-pink-400',
        media: 'https://file.enconvo.com/usecases/extension_system.mp4',
        mediaType: 'video'
    },
    {
        title: 'Agent Mode',
        description: 'Experience a revolutionary AI assistant with memory, context awareness, and access to all EnConvo features and plugins. Leverage your knowledge base to complete complex tasks effortlessly. Coming soon to EnConvo - stay tuned!',
        icon: () => (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
        ),
        gradient: 'from-violet-500 to-fuchsia-500',
        media: 'https://file.enconvo.com/usecases/agent.mp4',
        mediaType: 'video'
    },
    {
        title: 'Online Video Downloader',
        description: 'Online Video Downloader tool, supporting platforms (TikTok, YouTube, Twitter, Instagram, Reddit, Vimeo, Pornhub, XVideos, etc.)',
        icon: () => (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
        ),
        gradient: 'from-pink-500 to-rose-500',
        media: 'https://www.youtube.com/watch?v=5SsVIPtTTCA',
        mediaType: 'youtube'
    },
    {
        title: 'Open Source',
        description: 'All Enconvo extensions are open source and available on <a href="https://github.com/enconvo" target="_blank" rel="noopener noreferrer">GitHub</a>, You can contribute to the project by submitting pull requests or reporting issues.',
        icon: () => (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
        ),
        gradient: 'from-violet-500 to-fuchsia-500',
        media: 'https://file.enconvo.com/usecases/opensource.png',
        mediaType: 'image'
    },
]


// {
//     title: 'Deep Research',
//     description: 'A powerful AI assistant that analyzes and integrates massive online information to help you complete multi-step research tasks. Now available to all users and compatible with all LLM providers.',
//     icon: () => (
//         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
//             <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
//         </svg>
//     ),
//     gradient: 'from-emerald-500 to-teal-500',
//     media: 'https://www.youtube.com/watch?v=PMpzCbdysjQ',
//     mediaType: 'youtube'
// },