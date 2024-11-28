import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Tab } from '@headlessui/react'
import clsx from 'clsx'

import { Container } from '@/components/Container'
import comingSoon from '@/images/coming soon.png'
import writing from '@/images/features/writing.gif'
import plugin from '@/images/features/plugin.gif'
import chain from '@/images/features/chain.gif'
import { ArchiveIcon, Component1Icon, CubeIcon, EyeOpenIcon, FileIcon, FileTextIcon, ImageIcon, MixIcon, CardStackIcon } from "@radix-ui/react-icons";
import { ViewColumnsIcon } from '@heroicons/react/24/outline'
import { ChatWithDocument } from './features/ChatWithDocument'
import { CompressImages } from './features/CompressImages'
import { TranslateEngines } from './features/TranslateEngines'
import { KnowledgeBase } from './features/KnowledgeBase'
import { PopBar } from './features/PopBar'
import { ImageGeneration } from './features/ImageGeneration'
import { VisionChat } from './features/VisionChat'
import { PluginSystem } from './features/PluginSystem'
import { LocalModels } from './features/LocalModels'
import { SeamlessAccess } from './features/SeamlessAccess'


export function PrimaryFeatures() {
    let [tabOrientation, setTabOrientation] = useState('horizontal')


    useEffect(() => {
        let lgMediaQuery = window.matchMedia('(min-width: 1024px)')

        function onMediaQueryChange({ matches }) {
            setTabOrientation(matches ? 'vertical' : 'horizontal')
        }

        onMediaQueryChange(lgMediaQuery)
        lgMediaQuery.addEventListener('change', onMediaQueryChange)

        return () => {
            lgMediaQuery.removeEventListener('change', onMediaQueryChange)
        }
    }, [])

    return (
        <section
            id="features"
            aria-label="Features for running your books"
            className="relative overflow-hidden bg-gray-900 pb-28 sm:pt-20 pt-6 sm:py-32"
        >

            <Container className="relative">
                <div className="max-w-2xl md:mx-auto md:text-center xl:max-w-none">
                    <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl md:text-5xl">
                        The future is just beginning.
                    </h2>
                    <p className="mt-6 text-lg tracking-tight text-blue-100">
                        The future is full of possibilities, challenges and opportunities, and with
                        innovation and collaboration, we can achieve remarkable breakthroughs.
                    </p>
                </div>

                <SeamlessAccess />

                <PluginSystem />

                <VisionChat />

                <ImageGeneration />

                <PopBar />

                <ChatWithDocument />

                <LocalModels />

                <CompressImages />

                <TranslateEngines />

                <KnowledgeBase />

            </Container>
        </section>
    )
}
