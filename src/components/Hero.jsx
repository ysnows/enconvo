import {useState} from 'react'
import {Dialog} from '@headlessui/react'
import {Bars3Icon, XMarkIcon} from '@heroicons/react/24/outline'
import {Fragment} from 'react'
import {Menu, Transition} from '@headlessui/react'
import {EllipsisVerticalIcon} from '@heroicons/react/20/solid'
import Link from "next/link";

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}


const navigation = [
    {name: 'Features', href: '#features'},
    {name: 'Pricing', href: '#pricing'},
    {name: 'Twitter', href: 'https://twitter.com/EnConvoAI'},
    {name: 'Telegram', href: 'https://t.me/+iHQntezKbVViMWE1'},
    {name: 'Developer', href: '/developer'},
]

export function Hero() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (<div className="bg-gray-900">
        <header className="absolute inset-x-0 top-0 z-50">
            <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
                <div className="ml-32 flex lg:flex-1 items-center ">
                    <img
                        className="h-10 w-auto"
                        src="https://raw.githubusercontent.com/ysnows/sparkle/main/media/images/enconvologo.png"
                        alt=""
                    />
                    <div className="ml-3">
                        <span className="text-white font-bold">En-Convo</span>
                    </div>
                </div>
                <div className="flex lg:hidden">
                    <button
                        type="button"
                        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-400"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <span className="sr-only">Open main menu</span>
                        <Bars3Icon className="h-6 w-6" aria-hidden="true"/>
                    </button>
                </div>
                <div className="mr-32 hidden lg:flex lg:gap-x-12">
                    {navigation.map((item) => (
                        <a key={item.name} href={item.href === 'menu' ? null : item.href}
                           target={item.href.startsWith('http') ? '_blank' : '_self'}
                           className="text-sm font-semibold leading-6 text-white"
                           rel="noreferrer">
                            {item.name}
                        </a>
                    ))}

                    <Menu as="div" className="relative inline-block text-left">
                        <div>
                            <Menu.Button
                                className="text-sm font-semibold leading-6 text-white">
                                <span>More</span>
                            </Menu.Button>
                        </div>

                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <Menu.Items
                                className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="py-1">
                                    <Menu.Item>
                                        {({active}) => (
                                            <Link href="/privacy"
                                                  className={classNames(active ? 'bg-gray-100 text-gray-900' : 'text-gray-700', 'block px-4 py-2 text-sm')}
                                            >
                                                Privacy Policy
                                            </Link>)}
                                    </Menu.Item>
                                    <Menu.Item>
                                        {({active}) => (<Link
                                            href="/terms"
                                            className={classNames(active ? 'bg-gray-100 text-gray-900' : 'text-gray-700', 'block px-4 py-2 text-sm')}
                                        >
                                            Terms of Use
                                        </Link>)}
                                    </Menu.Item>
                                </div>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                </div>
                {/*<a*/}
                {/*    href="#"*/}
                {/*    className="rounded-md bg-indigo-700 px-3.5 py-1.5 text-sm  font-semibold text-white shadow-sm hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"*/}
                {/*>*/}
                {/*    Download (Coming Soon)*/}
                {/*</a>*/}
                {/*<div className="hidden lg:flex lg:basis-1/12 lg:justify-end">*/}
                {/*    /!*<a href="#" className="text-sm font-semibold leading-6 text-white">*!/*/}
                {/*    /!*    Log in <span aria-hidden="true">&rarr;</span>*!/*/}
                {/*    /!*</a>*!/*/}
                {/*</div>*/}
            </nav>
            <Dialog as="div" className="lg:hidden" open={mobileMenuOpen}
                    onClose={setMobileMenuOpen}>
                <div className="fixed inset-0 z-50"/>
                <Dialog.Panel
                    className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-white/10">
                    <div className="flex items-center justify-between">
                        <a href="#" className="-m-1.5 p-1.5">
                            <span className="sr-only">Your Company</span>
                            <img
                                className="h-8 w-auto"
                                src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500"
                                alt=""
                            />
                        </a>
                        <button
                            type="button"
                            className="-m-2.5 rounded-md p-2.5 text-gray-400"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <span className="sr-only">Close menu</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true"/>
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
            <div className="py-24 sm:py-32 lg:pb-40">
                <div className="mx-auto max-w-7xl  px-6 lg:px-8 ">

                    <div className="mx-auto max-w-5xl   text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl ">
                            <br/>
                            <br/>
                            Be there for you whenever you need
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-gray-300">EnConvo allows you
                            to access AI at any time, within any software. It can assist you
                            with convenient and efficient writing, coding, or any other task
                            beyond imagination.</p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">

                            <a
                                target="_blank"
                                className="rounded-md px-16 py-4 lg:text-sm sm:text-xs font-semibold text-white shadow-sm bg-gradient-to-br from-purple-500 to-purple-900 hover:from-purple-700 hover:to-purple-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 disabled truncate"
                                rel="noreferrer"
                                href="https://enconvo.lemonsqueezy.com/checkout/buy/1baaf4ba-fcbf-4452-bfc0-2f46d054bd4b"
                            >
                                Download EnConvo
                            </a>

                            {/*<a href="#" className="text-sm font-semibold leading-6 text-white">*/}
                            {/*    Learn more <span aria-hidden="true">→</span>*/}
                            {/*</a>*/}
                            <a href="https://www.producthunt.com/posts/enconvo?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-enconvo"
                               target="_blank" rel="noreferrer"><img
                                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=395518&theme=light"
                                alt="Enconvo - seamless&#0032;ai&#0032;assistant&#0032; | Product Hunt"
                                width="250"
                                height="54"/></a>

                        </div>

                        <div>
                        </div>

                    </div>

                    <iframe

                        src="https://www.youtube.com/embed/dzOpL40ha0Y"
                        title="YouTube video player" frameBorder="0"
                        className="w-full aspect-video mt-16  rounded-md bg-white/5 shadow-2xl ring-1 ring-white/10 sm:mt-24"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; "
                        allowFullScreen></iframe>
                    {/*<img*/}
                    {/*    src="https://file-newi.oss-cn-qingdao.aliyuncs.com/app-screenshot.png"*/}
                    {/*    alt="App screenshot"*/}
                    {/*    width={2432}*/}
                    {/*    height={1442}*/}
                    {/*    className="mt-16 rounded-md bg-white/5 shadow-2xl ring-1 ring-white/10 sm:mt-24"*/}
                    {/*/>*/}
                </div>
            </div>
            <div
                className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
                aria-hidden="true"
            >
                {/*<div*/}
                {/*    className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"*/}
                {/*    style={{*/}
                {/*        clipPath:*/}
                {/*            'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',*/}
                {/*    }}*/}
                {/*/>*/}
            </div>
        </div>
    </div>)
}
