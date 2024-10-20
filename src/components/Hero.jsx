import { useEffect, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from "next/link";
import { Logo } from "@/components/Logo";

import {
    createClientComponentClient
} from '@supabase/auth-helpers-nextjs'


function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}



export function Hero() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const [loginState, setLoginState] = useState("login")
    const [navigation, setNavigation] = useState([
        { name: 'Features', href: '#features' },
        {
            name: 'Pricing',
            href: '#pricing'
        },
        {
            name: 'Store',
            href: 'https://store.enconvo.com/'
        },
        {
            name: 'Guides',
            href: 'https://docs.enconvo.com/docs/intro'
        },
        {
            name: 'Changelog',
            href: 'https://docs.enconvo.com/changelog'
        },
        { name: 'Discord', href: 'https://discord.gg/jYsdVRRK2k' },
        {
            name: 'Log in',
            href: '/login'
        },
    ])

    const supabase = createClientComponentClient()

    useEffect(() => {
        supabase.auth.getSession().then(({ data, error }) => {
            if (data.session) {

                setNavigation(


                    [
                        { name: 'Features', href: '#features' },
                        {
                            name: 'Pricing',
                            href: '#pricing'
                        },
                        {
                            name: 'Store',
                            href: 'https://store.enconvo.com/'
                        },
                        {
                            name: 'Guides',
                            href: 'https://docs.enconvo.com/docs/intro'
                        },
                        {
                            name: 'Changelog',
                            href: 'https://docs.enconvo.com/changelog'
                        },
                        { name: 'Discord', href: 'https://discord.gg/jYsdVRRK2k' },
                        {
                            name: data.session.user.user_metadata.name,
                            href: '/login'
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
                        <Logo className="h-10 w-auto" />
                    </Link>

                    <div className="ml-3">
                        <span className="text-white font-bold">Enconvo</span>
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

                <div className="mr-32 hidden lg:flex lg:gap-x-12">
                    {navigation.map((item) => (
                        <a key={item.name} href={item.href === 'menu' ? null : item.href}
                            target={item.href.startsWith('http') ? '_blank' : '_self'}
                            className="text-sm font-semibold leading-6 text-white"
                            rel="noreferrer">
                            {item.name}
                        </a>))}

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
                                {navigation.map((item) => (<a
                                    key={item.name}
                                    href={item.href}
                                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-gray-800"
                                >
                                    {item.name}
                                </a>))}
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
            <div class='mt-4 w-full flex justify-center'>

                
                <div class='mt-4 px-10 py-px flex items-center justify-center border  border-purple-200 rounded-md'>
                    <span class="text-white font-semibold">Happy Early Black Friday. Enjoy</span>
                    <span class="ml-2 py-px px-3 bg-red-600 font-bold text-white rounded-sm border-1 border-dashed border-red-600">
                        60% off
                    </span>
                    &nbsp;

                    <a href="#pricing" class="text-red-600 font-bold py-2 px-4 rounded  transition-colors duration-300">
                        Check it now
                    </a>
                </div>

            </div>

            <div
                className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
                aria-hidden="true"
            >
                <div
                    className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                    style={{
                        clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                    }}
                />
            </div>

            <div className=" py-28 sm:py-48 lg:pb-40">

                <div className="mx-auto max-w-7xl  px-6 lg:px-8 ">

                    <div className="mx-auto max-w-5xl   text-center">
                        <h1 className="bg-gradient-to-r from-red-500  to-blue-500 text-transparent bg-clip-text text-3xl font-bold tracking-tight sm:text-6xl">
                            Productivity Powered by AI
                        </h1>

                        <p className="mt-8 text-sm sm:text-base leading-8 text-gray-300">EnConvo
                            allows you
                            to access AI at any time, within any software. It can assist you
                            with convenient and efficient writing, coding, or any other task
                            beyond imagination.</p>
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
                                    className=" pb-3  pl-1">v1.9.14</span>
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

                    <video className="mt-16 rounded-md bg-white/5 w-full  shadow-2xl ring-1 ring-white/10 sm:mt-24" controls autoPlay muted>
                        <source src="https://file.enconvo.com/enconvo.mp4" type="video/mp4" />
                    </video>
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
