import {useEffect, useState} from 'react'
import Image from 'next/image'
import {Tab} from '@headlessui/react'
import clsx from 'clsx'

import {Container} from '@/components/Container'
import comingSoon from '@/images/coming soon.png'
import writing from '@/images/features/writing.gif'
import plugin from '@/images/features/plugin.gif'
import chain from '@/images/features/chain.gif'

const features = [
    {
        title: 'Seamless Acess',
        description:
            "Get to your prompts&tools in anywhere&anytime with only one entrance",
        image: "https://raw.githubusercontent.com/ysnows/sparkle/main/media/images/378shots_so.png",
    },
    {
        title: 'Plugin System',
        description:
            "Combine the power of AI with your existing tools.",
        image: "https://raw.githubusercontent.com/ysnows/sparkle/main/media/images/581shots_so.png",
        video: undefined
    },
    {
        title: 'Plugin Chain',
        description:
            "Combine the power of plugin with other plugins again and again",
        image: "https://raw.githubusercontent.com/ysnows/sparkle/main/media/images/787shots_so.png",
    },
    {
        title: 'Chat With Data (Coming Soon)',
        description:
            "Chat with your own private data, such as PDFs, Word documents, videos, images, Markdown files, and more, in a convenient and engaging way.",
        image: "https://github.com/ysnows/sparkle/blob/main/media/images/coming%20soon.png?raw=true",
        video: undefined
    }
]

export function PrimaryFeatures() {
    let [tabOrientation, setTabOrientation] = useState('horizontal')


    useEffect(() => {
        let lgMediaQuery = window.matchMedia('(min-width: 1024px)')

        function onMediaQueryChange({matches}) {
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


                <div
                    className="flex flex-col sm:flex-row lg:flex-row  text-white font-mono sm:mt-28 mt-18 ">

                    <div className="pr-20 mt-16 flex flex-col "
                         style={{
                             flexGrow: 0.6,
                             flexBasis: 0,
                             flexShrink: 1,
                         }}
                    >

                        <div
                            className="bg-gradient-to-tr from-red-500  to-blue-900  w-14 h-14 flex items-center justify-center rounded-xl ">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                 strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z"/>
                            </svg>
                        </div>

                        <p className="font-bold text-4xl mt-6">
                            <span
                                className="bg-gradient-to-tr from-red-300  to-blue-800 text-transparent bg-clip-text">Seamless</span> Access
                        </p>
                        <p className="mt-6">
                            The only entrance point that provides access to
                            your prompts and tools anywhere and anytime , ensuring convenience and
                            efficiency in managing your tasks and
                            resources.
                        </p>
                    </div>

                    <div className="flex-1 sm:mt-0 mt-6">
                        <Image
                            className="basis-0 rounded-xl "
                            src={writing}
                            alt={""}/>
                    </div>

                </div>

                <div
                    className="flex text-white font-mono sm:mt-60 mt-6  flex-col sm:flex-row lg:flex-row  ">

                    <div className="pr-20 mt-16 flex flex-col  "
                         style={{
                             flexGrow: 0.6,
                             flexBasis: 0,
                             flexShrink: 1,
                         }}
                    >

                        <div
                            className="bg-gradient-to-bl from-cyan-950 to-emerald-200  w-14 h-14 flex items-center justify-center rounded-xl ">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                 strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z"/>
                            </svg>
                        </div>

                        <p className="font-bold text-4xl mt-6">
                            <span
                                className="bg-gradient-to-tr from-cyan-950 to-emerald-200 text-transparent bg-clip-text">Plugin </span> System
                        </p>
                        <p className="mt-6">
                            With the plugin system, you can easily add new features to your system,
                            and If you are a developer, you can easily create your own plugin and
                            share it with others.
                        </p>
                    </div>
                    <div className="flex-1 mt-6 sm:mt-0">
                        <Image
                            className="basis-0 rounded-xl "
                            src={plugin}
                            alt={""}/>
                    </div>

                </div>
                <div
                    className="flex text-white font-mono  sm:mt-60 mt-6  flex-col sm:flex-row lg:flex-row ">

                    <div className="pr-20 mt-16 flex flex-col  "
                         style={{
                             flexGrow: 0.6,
                             flexBasis: 0,
                             flexShrink: 1,
                         }}
                    >
                        <div
                            className="bg-gradient-to-l from-purple-800 to-cyan-300  w-14 h-14 flex items-center justify-center rounded-xl ">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                 strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605"/>
                            </svg>

                        </div>

                        <p className="font-bold text-4xl mt-6">
                            <span
                                className="bg-gradient-to-tr from-purple-800 to-cyan-300 text-transparent bg-clip-text">Chain </span> Flow
                        </p>
                        <p className="mt-6">
                            Combine the power of plugin with other plugins again and again to
                            customize
                            your own powerful workflow </p>
                    </div>
                    <div className="flex-1 mt-6 sm:mt-0">
                        <Image
                            className="basis-0 rounded-xl "
                            src={chain}
                            alt={""}/>
                    </div>


                </div>
            </Container>
        </section>
    )
}
