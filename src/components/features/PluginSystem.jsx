import Image from 'next/image'
import plugin from '@/images/features/plugin.gif'

export function PluginSystem() {
    return (
        <div className="flex text-white font-mono sm:mt-60 mt-6 flex-col sm:flex-row lg:flex-row">
            <div className="pr-20 mt-16 flex flex-col"
                style={{
                    flexGrow: 0.6,
                    flexBasis: 0,
                    flexShrink: 1,
                }}>
                <div className="bg-gradient-to-bl from-cyan-950 to-emerald-200 w-14 h-14 flex items-center justify-center rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                        strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                </div>

                <p className="font-bold text-4xl mt-6">
                    <span className="bg-gradient-to-tr from-cyan-950 to-emerald-200 text-transparent bg-clip-text">
                        Plugin
                    </span> System
                </p>
                <p className="mt-6">
                    With the plugin system, you can easily add new features to your system,
                    and If you are a developer, you can easily create your own plugin and
                    share it with others.
                </p>
            </div>

            <div className="flex-1 mt-6 sm:mt-0">
                <Image
                    className="basis-0 rounded-xl"
                    src={plugin}
                    alt="Plugin System"
                />
            </div>
        </div>
    )
}
