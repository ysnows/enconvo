import { useEffect, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from "next/link";
import { Logo } from "@/components/Logo";
import Image from 'next/image';
import allInOne from '@/images/ai_launcher.png'
import {
    createClientComponentClient
} from '@supabase/auth-helpers-nextjs'


export function Hero() {
    const [isVideoLoaded, setIsVideoLoaded] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const [loginState, setLoginState] = useState("login")
    const [navigation, setNavigation] = useState([
        { name: 'Features', href: '#features' },
        {
            name: 'Pricing',
            href: '#pricing'
        },
        {
            name: 'Guides',
            href: 'https://docs.enconvo.com/docs/intro'
        },
        {
            name: 'Changelog',
            href: 'https://docs.enconvo.com/changelog'
        },
        { name: 'Privacy', href: '/privacy' },
        {
            name: 'Log in',
            href: '/login'
        },
    ])

    const socialLinks = [
        {
            name: 'Discord',
            href: 'https://discord.gg/jYsdVRRK2k',
            icon: (props) => (
                <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                </svg>
            ),
        },
        {
            name: 'Twitter',
            href: 'https://twitter.com/enconvo_ai',
            icon: (props) => (
                <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            ),
        },
    ]

    const supabase = createClientComponentClient()

    useEffect(() => {
        console.log("window.endorsely_referral", window.endorsely_referral)

        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setNavigation(
                    [
                        { name: 'Features', href: '#features' },
                        {
                            name: 'Pricing',
                            href: '#pricing'
                        },
                        {
                            name: 'Guides',
                            href: 'https://docs.enconvo.com/docs/intro'
                        },
                        {
                            name: 'Changelog',
                            href: 'https://docs.enconvo.com/changelog'
                        },
                        { name: 'Privacy', href: '/privacy' },
                        {
                            name: data.session.user.user_metadata.name,
                            href: '/account'
                        }
                    ]
                )
            }
        })
    }, [])

    return (<div className="bg-gray-900">
        <header className="absolute inset-x-0 top-0 z-50">
            <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
                <div className="ml-32 flex lg:flex-1 items-center ">
                    <Link href="/" aria-label="Home">
                        <Logo className="h-8 w-auto" />
                    </Link>

                    <div className="ml-3">
                        <span className="text-white font-bold">EnConvo</span>
                    </div>
                </div>
                <div className="flex lg:hidden">
                    <button
                        type="button"
                        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-400"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <span className="sr-only">Open main menu</span>
                        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                    </button>
                </div>

                <div className="mr-32 hidden lg:flex lg:gap-x-12 items-center">
                    {navigation.map((item) => (
                        <a key={item.name} href={item.href === 'menu' ? null : item.href}
                            target={item.href.startsWith('http') ? '_blank' : '_self'}
                            className="text-sm font-semibold leading-6 text-white"
                            rel="noreferrer">
                            {item.name}
                        </a>
                    ))}
                    <div className="flex space-x-3 items-center">
                        {socialLinks.map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-400 hover:text-gray-300"
                            >
                                <span className="sr-only">{item.name}</span>
                                <item.icon className="h-5 w-5" aria-hidden="true" />
                            </a>
                        ))}
                    </div>
                </div>
            </nav>



            <Dialog as="div" className="lg:hidden" open={mobileMenuOpen}
                onClose={setMobileMenuOpen}>
                <div className="fixed inset-0 z-50" />
                <Dialog.Panel
                    className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-white/10">
                    <div className="flex items-center justify-between">
                        <a href="#" className="-m-1.5 p-1.5">
                            <span className="sr-only">Your Company</span>

                        </a>
                        <button
                            type="button"
                            className="-m-2.5 rounded-md p-2.5 text-gray-400"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <span className="sr-only">Close menu</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </div>
                    <div className="mt-6 flow-root">
                        <div className="-my-6 divide-y divide-gray-500/25">
                            <div className="space-y-2 py-6">
                                {navigation.map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-gray-800"
                                    >
                                        {item.name}
                                    </a>
                                ))}
                                {socialLinks.map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="-mx-3 flex items-center rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-gray-800"
                                    >
                                        <item.icon className="h-5 w-5 mr-3" aria-hidden="true" />
                                        {item.name}
                                    </a>
                                ))}
                            </div>
                            <div className="py-6">
                                <a
                                    href="#"
                                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white hover:bg-gray-800"
                                >
                                    Log in
                                </a>
                            </div>
                        </div>
                    </div>
                </Dialog.Panel>
            </Dialog>
        </header>


        <div className="relative isolate pt-14">
            <div className='mt-4 w-full flex justify-center px-4 sm:px-0'>
                <a href="#pricing" className='mt-4 px-6 sm:px-12 md:px-24 py-2 sm:py-4 flex flex-col sm:flex-row items-center justify-center sm:space-x-6 space-y-2 sm:space-y-0 border border-purple-400/30 rounded-2xl bg-gradient-to-r from-purple-950/60 to-purple-800/60 backdrop-blur-md shadow-xl hover:shadow-purple-500/30 transition-all duration-500 cursor-pointer'>
                    <span className="text-white/90 font-bold text-lg sm:text-xl text-center sm:text-left">DeepSeek R1、DeepSeek V3</span>
                    <span className="py-1.5 px-6 sm:px-10 bg-gradient-to-r from-red-500 to-pink-500 font-bold text-white text-xl sm:text-2xl rounded-xl shadow-lg shadow-red-500/20 animate-pulse whitespace-nowrap">
                        Free Unlimited Use
                    </span>
                </a>
            </div>

            <div className=" py-28 sm:py-48 lg:pb-40">

                <div className="mx-auto max-w-7xl  px-6 lg:px-8 ">

                    <div className="mx-auto max-w-5xl text-center">
                        <h1 className="bg-gradient-to-r from-red-500 to-blue-500 text-transparent bg-clip-text text-3xl font-bold tracking-tight sm:text-6xl pb-2">
                            The AI Agent Launcher
                        </h1>

                        <p className="mt-10 text-sm sm:text-base leading-8 text-gray-300">
                            Discover EnConvo - your AI Agent Launcher that revolutionizes productivity. With instant access, automate your daily tasks effortlessly. Our intelligent AI Agent system, powered by 150+ built-in tools and MCP support, learns and adapts to your workflow. Experience seamless automation and enhanced productivity with the most versatile AI assistant for macOS.
                        </p>
                        <div className="mt-10 sm:mt-20 flex flex-col items-center  gap-x-6">

                            <Link
                                target="_blank"
                                className="border-2 border-purple-300  rounded-xl px-16 py-3 sm:px-24 sm:py-4 lg:text-base sm:text-xs font-semibold text-white shadow-sm bg-gradient-to-br from-purple-500 to-purple-900 hover:from-purple-700 hover:to-purple-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 disabled truncate"
                                rel="noreferrer"
                                href="https://api.enconvo.com/app/download"
                            >
                                Download For Free Trial
                            </Link>


                            <div className="mt-4 text-sm font-normal text-gray-500 space-x-4">
                                <span
                                    className=" pb-3  pl-1">v2.0.6</span>
                                <span className="pb-3  pl-1 text-xs">|</span>
                                <span
                                    className=" pb-3  pl-1">macOS 13+</span>
                            </div>

                        </div>

                        <div>
                        </div>

                    </div>
                    {/* <Image
                        src={appScreeShot}
                        alt="App screenshot"
                        className="mt-16 rounded-md bg-white/5 shadow-2xl ring-1 ring-white/10 sm:mt-24"
                    /> */}

                    {/* <Video src={appVideo}
                        className="mt-16 rounded-md bg-white/5 shadow-2xl ring-1 ring-white/10 sm:mt-24"
                    >

                    </Video> */}

                    <div className="relative mt-16 sm:mt-24">
                        {!isVideoLoaded ? (
                            <>
                                <Image
                                    src={allInOne}
                                    alt="EnConvo Preview"
                                    className="rounded-md bg-white/5 w-full shadow-2xl ring-1 ring-white/10"
                                    width={1200}
                                    height={800}
                                    priority
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {/* Play button with pulsing glow effect */}
                                    <button
                                        onClick={() => setIsVideoLoaded(true)}
                                        className="relative w-20 h-20 bg-purple-600/80 rounded-full flex items-center justify-center group hover:bg-purple-500/90 transition-all duration-300 backdrop-blur-sm"
                                    >
                                        {/* Outer pulsing glow */}
                                        <div className="absolute w-full h-full rounded-full bg-purple-500/30 animate-pulse-slow"></div>
                                        <div className="absolute w-[120%] h-[120%] rounded-full bg-purple-400/20 animate-pulse-slower"></div>

                                        {/* Inner circle with play icon */}
                                        <div className="w-16 h-16 bg-purple-800/80 rounded-full flex items-center justify-center transform group-hover:scale-90 transition-all duration-300">
                                            <svg
                                                className="w-8 h-8 text-white fill-current transform translate-x-0.5"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <video
                                className="rounded-md bg-white/5 w-full shadow-2xl ring-1 ring-white/10"
                                controls
                                autoPlay
                                muted
                            >
                                <source src="https://file.enconvo.com/ai_launcher.mp4" type="video/mp4" />
                            </video>
                        )}
                    </div>
                </div>
            </div>
            <div
                className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
                aria-hidden="true"
            >
            </div>

        </div>

    </div>)
}
