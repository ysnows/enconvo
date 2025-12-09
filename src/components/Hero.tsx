import { useEffect, useState } from 'react'
import { Dialog, Menu } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import Link from "next/link"
import { Logo } from "@/components/Logo"
import Image from 'next/image'
import allInOne from '@/images/main.jpg'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ParticleBackground } from '@/components/ParticleBackground'

declare global {
    interface Window {
        endorsely_referral?: any
    }
}

interface NavigationItem {
    name: string
    href: string
}

interface SocialLink {
    name: string
    href: string
    icon: (props: any) => JSX.Element
}


export function Hero() {
    const [isVideoLoaded, setIsVideoLoaded] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const [loginState, setLoginState] = useState("login")
    const [navigation, setNavigation] = useState<NavigationItem[]>([
        { name: 'Features', href: '#features' },
        {
            name: 'Pricing',
            href: '#pricing'
        },
        {
            name: 'Docs',
            href: 'https://docs.enconvo.ai/'
        },
        {
            name: 'Affiliate',
            href: 'https://affiliate.enconvo.com/'
        },
        {
            name: 'Log in',
            href: '/login'
        },
    ])

    const socialLinks: SocialLink[] = [
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
                            name: 'Docs',
                            href: 'https://docs.enconvo.ai/'
                        },
                        {
                            name: 'Affiliate',
                            href: 'https://affiliate.enconvo.com/'
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

    return (<div className="bg-black relative overflow-hidden">
        <ParticleBackground />
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800/50">
            <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
                <div className="flex lg:flex-1 items-center">
                    <Link href="/" aria-label="Home" className="flex items-center gap-3">
                        <Logo className="h-8 w-auto" />
                        <span className="text-white font-bold text-lg">EnConvo</span>
                    </Link>
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

                <div className="hidden lg:flex lg:gap-x-8 items-center">
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
                                        onClick={() => setMobileMenuOpen(false)}
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
                                        onClick={() => setMobileMenuOpen(false)}
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
                                    onClick={() => setMobileMenuOpen(false)}
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


        <div className="relative isolate pt-20 z-10">


            <div className="py-20 sm:py-32 lg:py-40">

                <div className="mx-auto max-w-7xl  px-6 lg:px-8 ">

                    <div className="mx-auto max-w-5xl text-center">
                        {/* 主标题优化 */}
                        <div className="relative">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
                                The Always‑Online AI Companion That Knows You Best
                            </h1>

                            {/* Black Friday Button */}

                        </div>

                        {/* 描述文字优化 */}
                        <p className="mt-6 text-xl sm:text-2xl leading-relaxed text-gray-400 max-w-3xl mx-auto">
                            Contextually aware of your screen and apps, delivering the perfect response to automate your complex tasks.
                        </p>
                        <div className="mt-10 flex flex-col items-center space-y-6">
                            {/* 主要下载按钮 */}
                            <Menu as="div" className="relative">
                                <Menu.Button className="group inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-white/10 hover:bg-white/15 rounded-xl transition-all duration-200">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                    </svg>
                                    <span>Download v2.2.21</span>
                                    <ChevronDownIcon className="w-4 h-4 ml-2" />
                                </Menu.Button>

                                <Menu.Items className="absolute top-full mt-2 w-80 bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl ring-1 ring-white/10 focus:outline-none z-50">
                                    <div className="p-4">


                                        <div className="space-y-2">
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <a
                                                        href="https://api.enconvo.com/app/download?arch=arm64&platform=darwin"
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className={`${active ? 'bg-purple-600/20 ring-1 ring-purple-500/40' : ''
                                                            } group flex items-center w-full px-4 py-3 text-sm font-medium text-white rounded-xl transition-all duration-200 hover:bg-purple-600/20 hover:ring-1 hover:ring-purple-500/40`}
                                                    >
                                                        <div className="flex items-center justify-between w-full">
                                                            <div className="flex items-center">
                                                                <svg className="w-5 h-5 mr-3 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                                                                </svg>
                                                                <div>
                                                                    <div className="text-white font-medium">macOS (Apple Silicon)</div>
                                                                    <div className="text-gray-400 text-xs">For M1, M2, M3, M4 Macs</div>
                                                                </div>
                                                            </div>
                                                            <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" />
                                                            </svg>
                                                        </div>
                                                    </a>
                                                )}
                                            </Menu.Item>

                                            <Menu.Item>
                                                {({ active }) => (
                                                    <a
                                                        href="https://api.enconvo.com/app/download?arch=x64&platform=darwin"
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className={`${active ? 'bg-purple-600/20 ring-1 ring-purple-500/40' : ''
                                                            } group flex items-center w-full px-4 py-3 text-sm font-medium text-white rounded-xl transition-all duration-200 hover:bg-purple-600/20 hover:ring-1 hover:ring-purple-500/40`}
                                                    >
                                                        <div className="flex items-center justify-between w-full">
                                                            <div className="flex items-center">
                                                                <svg className="w-5 h-5 mr-3 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                                                                </svg>
                                                                <div>
                                                                    <div className="text-white font-medium  text-start">macOS (Intel)</div>
                                                                    <div className="text-gray-400 text-xs">For Intel-based Macs</div>
                                                                </div>
                                                            </div>
                                                            <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" />
                                                            </svg>
                                                        </div>
                                                    </a>
                                                )}
                                            </Menu.Item>


                                            {/* <Menu.Item>
                                                {({ active }) => (
                                                    <div
                                                        className={`${active ? 'bg-purple-600/20 ring-1 ring-purple-500/40' : ''
                                                            } group flex items-center w-full px-4 py-3 text-sm font-medium text-white rounded-xl transition-all duration-200 hover:bg-purple-600/20 hover:ring-1 hover:ring-purple-500/40 cursor-default`}
                                                    >
                                                        <div className="flex items-center justify-between w-full">
                                                            <div className="flex items-center">
                                                                <svg className="w-5 h-5 mr-3 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                                                </svg>
                                                                <div>
                                                                    <div className="text-white font-medium text-start">Windows</div>
                                                                    <div className="text-gray-400 text-xs">Under Development</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Menu.Item> */}
                                        </div>
                                    </div>
                                </Menu.Items>
                            </Menu>

                            {/* 版本信息 */}
                            <div className="flex items-center space-x-6 text-sm text-gray-400">
                                <span>macOS 13+ (Intel & Apple Silicon)</span>
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
                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                <iframe
                                    className="absolute top-0 left-0 w-full h-full rounded-md shadow-2xl ring-1 ring-white/10"
                                    src="https://www.youtube.com/embed/QucptiybwVk?autoplay=1&mute=1"
                                    title="EnConvo Demo"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
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
