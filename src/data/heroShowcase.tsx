// Hero showcase data — Hero tabs and their sub-scenes.
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
                media: { type: 'video', src: 'https://file.enconvo.com/videos/app-sidebar-launch.mp4' },
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
                id: 'launch-film',
                label: 'Launch film',
                caption: 'Voice, Live Screen, Doodle, and instant translation — one island does it all.',
                media: { type: 'video', src: 'https://file.enconvo.com/videos/dynamic-island-launch.mp4' },
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
                id: 'launch-film',
                label: 'Launch film',
                caption: 'Translate, fix spelling, read aloud, and inline edits — one selection, every action.',
                media: { type: 'video', src: 'https://file.enconvo.com/videos/popbar-launch.mp4' },
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
                id: 'launch-film',
                label: 'Launch film',
                caption: 'Hold a key, talk, and the text lands wherever your cursor is.',
                media: { type: 'video', src: 'https://file.enconvo.com/videos/dictation-launch-v32.mp4' },
            },
        ],
    },
    {
        id: 'meeting-caption',
        benefitLabel: 'Catch every word',
        productName: 'Meetings & Live Captions',
        tagline: 'Live captions, instant translation, and meeting notes — stay in the conversation.',
        subScenes: [
            {
                id: 'launch-film',
                label: 'Launch film',
                caption: 'Caption any app, translate as people speak, and turn meetings into clear notes.',
                media: { type: 'video', src: 'https://file.enconvo.com/videos/meeting-caption-launch-v21.mp4' },
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
                id: 'launch-film',
                label: 'Launch film',
                caption: 'Search and chat with your documents, notes, and captured ideas.',
                media: { type: 'video', src: 'https://file.enconvo.com/videos/knowledgebase-launch-v3.mp4?v=3' },
            },
        ],
    },
]
