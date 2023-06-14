import {useEffect, useState} from 'react'
import Image from 'next/image'
import {Tab} from '@headlessui/react'
import clsx from 'clsx'

import {Container} from '@/components/Container'
import comingSoon from '@/images/coming soon.png'

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
            className="relative overflow-hidden bg-gray-900 pb-28 pt-20 sm:py-32"
        >
            <Image
                className="absolute left-1/2 top-1/2 max-w-none translate-x-[-44%] translate-y-[-42%]"
                // src={backgroundImage}
                alt=""
                width={2245}
                height={1636}
                unoptimized
            />
            <Container className="relative">
                <div className="max-w-2xl md:mx-auto md:text-center xl:max-w-none">
                    <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl md:text-5xl">
                        The future is just beginning.
                    </h2>
                    <p className="mt-6 text-lg tracking-tight text-blue-100">
                        The future is full of possibilities, challenges and opportunities, and with innovation and collaboration, we can achieve remarkable breakthroughs.
                    </p>
                </div>
                <Tab.Group
                    as="div"
                    className="mt-16 grid grid-cols-1 items-center gap-y-2 pt-10 sm:gap-y-6 md:mt-20 lg:grid-cols-12 lg:pt-0"
                    vertical={tabOrientation === 'vertical'}
                >
                    {({selectedIndex}) => (
                        <>
                            <div
                                className="-mx-4 flex overflow-x-auto pb-4 sm:mx-0 sm:overflow-visible sm:pb-0 lg:col-span-5">
                                <Tab.List
                                    className="relative z-10 flex gap-x-4 whitespace-nowrap px-4 sm:mx-auto sm:px-0 lg:mx-0 lg:block lg:gap-x-0 lg:gap-y-1 lg:whitespace-normal">
                                    {features.map((feature, featureIndex) => (
                                        <div
                                            key={feature.title}
                                            className={clsx(
                                                'group relative rounded-full px-4 py-1 lg:rounded-l-xl lg:rounded-r-none lg:p-6',
                                                selectedIndex === featureIndex
                                                    ? 'bg-white lg:bg-white/10 lg:ring-1 lg:ring-inset lg:ring-white/10'
                                                    : 'hover:bg-white/10 lg:hover:bg-white/5'
                                            )}
                                        >
                                            <h3>
                                                <Tab
                                                    className={clsx(
                                                        'font-display text-lg [&:not(:focus-visible)]:focus:outline-none',
                                                        selectedIndex === featureIndex
                                                            ? 'text-blue-600 lg:text-white'
                                                            : 'text-blue-100 hover:text-white lg:text-white'
                                                    )}
                                                >
                                                    <span
                                                        className="absolute inset-0 rounded-full lg:rounded-l-xl lg:rounded-r-none"/>
                                                    {feature.title}
                                                </Tab>
                                            </h3>
                                            <p
                                                className={clsx(
                                                    'mt-2 hidden text-sm lg:block',
                                                    selectedIndex === featureIndex
                                                        ? 'text-white'
                                                        : 'text-blue-100 group-hover:text-white'
                                                )}
                                            >
                                                {feature.description}
                                            </p>
                                        </div>
                                    ))}
                                </Tab.List>
                            </div>
                            <Tab.Panels className="lg:col-span-7">
                                {features.map((feature) => (
                                    <Tab.Panel key={feature.title} unmount={false}>
                                        <div className="relative sm:px-6 lg:hidden">
                                            <div
                                                className="absolute -inset-x-4 bottom-[-4.25rem] top-[-6.5rem] bg-white/10 ring-1 ring-inset ring-white/10 sm:inset-x-0 sm:rounded-t-xl"/>
                                            <p className="relative mx-auto max-w-2xl text-base text-white sm:text-center">
                                                {feature.description}
                                            </p>
                                        </div>
                                        <div
                                            // sm:w-auto lg:mt-0 lg:w-[67.8125rem]
                                            className="sm:w-auto lg:mt-0 mt-10 lg:w-[67.8125rem] overflow-hidden ">

                                            {/* 判断如果feature.video存在则显示<video/>，否则显示<Image/>}
                                            {/*实现上边的逻辑*/}

                                            {feature.video
                                                ? <video
                                                    className="lg:w-10/12 sm:w-auto h-1/6 mt-10 lg:mt-0 rounded-xl"
                                                    controls>
                                                    <source src={feature.video} type="video/mp4"/>
                                                    Your browser does not support the video tag.
                                                </video>
                                                :
                                                <img
                                                    className="lg:w-10/12 sm:w-auto sm:h-auto lg:h-1/6 mt-10 lg:mt-0 rounded-xl"
                                                    src={feature.image}
                                                    />

                                                // <Image
                                                //     className="lg:w-10/12 sm:w-auto h-1/6 mt-10 lg:mt-0 rounded-xl"
                                                //     src={"https://github.com/ysnows/sparkle/blob/main/media/images/coming%20soon.png?raw=true"}
                                                //     alt=""
                                                //     width={2245}
                                                //     height={1636}
                                                //     priority
                                                //     sizes="(min-width: 1024px) 67.8125rem, (min-width: 640px) 100vw, 45rem"
                                                // />
                                            }
                                        </div>
                                    </Tab.Panel>
                                ))}
                            </Tab.Panels>
                        </>
                    )}
                </Tab.Group>
            </Container>
        </section>
    )
}
