// Hero showcase data — 7 Hero tabs × sub-scenes.
// Structure and vocabulary: docs/homepage-redesign-2026-07.md + root CONTEXT.md
// ("Hero showcase", "Hero tab", "Sub-scene", "Benefit label").
// Sub-scenes without `media` render as styled placeholders until their demo
// clip is recorded; dropping a video into `media` later needs no code change.

export interface SubSceneMedia {
    type: 'video' | 'image'
    src: string
}

export interface SubScene {
    id: string
    label: string
    caption: string
    media?: SubSceneMedia
}

export interface HeroTab {
    id: string
    benefitLabel: string
    productName: string
    tagline: string
    subScenes: SubScene[]
}

export const heroTabs: HeroTab[] = [
    {
        id: 'app-sidebar',
        benefitLabel: 'Works beside your apps',
        productName: 'App Sidebar',
        tagline: 'Dock an AI agent next to any app — it sees the app and works inside it.',
        subScenes: [
            {
                id: 'launch-film',
                label: 'Launch film',
                caption: 'Finder, Calendar, Notes, and Excel — one sidebar does the work in every app.',
                media: { type: 'video', src: '/videos/app-sidebar-launch.mp4' },
            },
            {
                id: 'excel',
                label: 'Excel live edit',
                caption: 'Ask for changes in plain language and watch them land in the open spreadsheet.',
            },
            {
                id: 'affinity',
                label: 'Affinity',
                caption: 'Drive professional apps without hunting through menus.',
            },
            {
                id: 'app-skills',
                label: 'Per-app skills & MCPs',
                caption: 'Pin specialized skills and MCP servers to each app — the agent comes prepared.',
            },
        ],
    },
    {
        id: 'dynamic-island',
        benefitLabel: 'One glance away',
        productName: 'Dynamic Island',
        tagline: 'A tiny always-on surface at the top of your screen. Hover, ask, done.',
        subScenes: [
            {
                id: 'voice-command',
                label: 'Voice Command',
                caption: 'Speak a command and it gets done — no window switching.',
            },
            {
                id: 'live-screen',
                label: 'Live Screen',
                caption: 'Share what is on your screen and ask about it in real time.',
                media: { type: 'video', src: 'https://file.enconvo.com/usecases/live_screen_camera.mp4' },
            },
            {
                id: 'doodle',
                label: 'Doodle',
                caption: 'Sketch over your screen to show the AI exactly what you mean.',
            },
            {
                id: 'screenshot-explain',
                label: 'Screenshot explain',
                caption: 'Snap any region and get an instant explanation.',
            },
            {
                id: 'app-shots',
                label: 'App Shots',
                caption: 'Capture app windows straight into the conversation.',
            },
        ],
    },
    {
        id: 'popbar',
        benefitLabel: 'Fix any text instantly',
        productName: 'PopBar',
        tagline: 'Select text in any app and a toolbar appears with one-click actions.',
        subScenes: [
            {
                id: 'fix-spelling',
                label: 'Fix Spelling',
                caption: 'Correct grammar and spelling in place, in any app.',
            },
            {
                id: 'read-aloud',
                label: 'Read Aloud',
                caption: 'Have any selection read to you in a natural voice.',
            },
            {
                id: 'translate',
                label: 'Translate',
                caption: 'Translate the selection without leaving the app.',
            },
        ],
    },
    {
        id: 'voice',
        benefitLabel: "Speak, don't type",
        productName: 'Voice & Dictation',
        tagline: 'System-wide dictation and live captions — online or fully offline.',
        subScenes: [
            {
                id: 'dictation',
                label: 'Global dictation',
                caption: 'Hold a key, talk, and the text lands wherever your cursor is.',
            },
            {
                id: 'live-captions',
                label: 'Live captions & meetings',
                caption: 'Real-time captions with speaker labels and meeting notes.',
                media: { type: 'video', src: 'https://file.enconvo.com/usecases/live_captions.mp4' },
            },
            {
                id: 'live-translation',
                label: 'Live translation',
                caption: 'Captions translated on the fly, for any audio on your Mac.',
            },
            {
                id: 'offline-models',
                label: 'Offline models',
                caption: 'MLX and CoreML speech models run entirely on your Mac.',
            },
        ],
    },
    {
        id: 'knowledge-base',
        benefitLabel: 'Your second brain',
        productName: 'Knowledge Base',
        tagline: 'Everything you capture becomes searchable, chattable knowledge.',
        subScenes: [
            {
                id: 'folder-sync',
                label: 'Drop in a folder',
                caption: 'Point it at a folder — it indexes and stays in sync automatically.',
                media: { type: 'video', src: 'https://file.enconvo.com/usecases/knowledge_base.mp4' },
            },
            {
                id: 'chat-docs',
                label: 'Chat with your documents',
                caption: 'Ask questions across PDFs, docs, sheets, and notes.',
                media: { type: 'video', src: 'https://file.enconvo.com/usecases/chat_with_documents.mp4' },
            },
            {
                id: 'quick-capture',
                label: 'Quick Capture',
                caption: 'Save anything you see with one hotkey.',
            },
            {
                id: 'voice-notes',
                label: 'Voice Notes',
                caption: 'Spoken thoughts, transcribed and filed automatically.',
            },
        ],
    },
    {
        id: 'smartbar',
        benefitLabel: 'Ask AI anywhere',
        productName: 'SmartBar',
        tagline: "One hotkey opens a command bar over whatever you're doing.",
        subScenes: [
            {
                id: 'ask',
                label: 'Ask AI',
                caption: 'Instant answers without switching apps.',
            },
            {
                id: 'mentions',
                label: '@ files & plugins',
                caption: 'Pull files, plugins, and tools into the conversation with @.',
            },
            {
                id: 'references',
                label: '# references',
                caption: 'Attach context and recent items with #.',
            },
        ],
    },
    {
        id: 'autopilot',
        benefitLabel: 'Runs your Mac for you',
        productName: 'Computer & Browser Use',
        tagline: 'An agent that clicks, types, and browses to finish the whole task.',
        subScenes: [
            {
                id: 'computer-use',
                label: 'Operate any app',
                caption: 'Watch it drive real apps end to end — clicks, keys, and all.',
            },
            {
                id: 'browser-use',
                label: 'Complete web tasks',
                caption: 'It browses, fills forms, and comes back with the result.',
            },
        ],
    },
]
