import Image from 'next/image'
import writing from '@/images/features/writing.gif'

export function SeamlessAccess() {
    return (
        <div className="flex flex-col sm:flex-row lg:flex-row text-white font-mono sm:mt-28 mt-18">
            <div className="pr-20 mt-16 flex flex-col"
                style={{
                    flexGrow: 0.6,
                    flexBasis: 0,
                    flexShrink: 1,
                }}>
                <div className="bg-gradient-to-tr from-red-500 to-blue-900 w-14 h-14 flex items-center justify-center rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                        strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
                    </svg>
                </div>

                <p className="font-bold text-4xl mt-6">
                    <span className="bg-gradient-to-tr from-red-300 to-blue-800 text-transparent bg-clip-text">
                        Seamless
                    </span> Access
                </p>
                <p className="mt-6">
                    The only entrance point that provides access to
                    your prompts and tools anywhere and anytime, ensuring convenience and
                    efficiency in managing your tasks and resources.
                </p>
            </div>

            <div className="flex-1 sm:mt-0 mt-6">
                <Image
                    className="basis-0 rounded-xl"
                    src={writing}
                    alt="Seamless Access"
                />
            </div>
        </div>
    )
}
