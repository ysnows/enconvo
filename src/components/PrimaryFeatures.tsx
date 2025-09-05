import { useEffect, useState } from 'react'
import { Container } from '@/components/Container'
import { Feature } from './features/Feature'
import { features } from '@/data/features'

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
            className="relative overflow-hidden bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-28 sm:pt-20 pt-6 sm:py-32"
        >
            {/* 背景装饰 */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
            
            <Container className="relative">
                <div className="max-w-4xl md:mx-auto md:text-center xl:max-w-none">
                    {/* 标题优化 */}
                    <div className="relative">
                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-center">
                            <span className="block">
                                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    New Real
                                </span>
                            </span>
                            <span className="block mt-2">
                                <span className="bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
                                    AI Agent!
                                </span>
                            </span>
                        </h2>
                        
                        {/* 装饰线 */}
                        <div className="mt-6 flex justify-center">
                            <div className="h-1 w-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                        </div>
                    </div>
                    
                    {/* 描述文字优化 */}
                    <p className="mt-8 text-xl sm:text-2xl leading-relaxed text-gray-300 max-w-5xl mx-auto">
                        Experience the future with our <span className="text-white font-semibold">revolutionary AI Agent</span> - an intelligent system that learns, adapts, and works autonomously. 
                        <br className="hidden lg:block" />
                        By combining advanced AI capabilities with an intuitive operating system, we're transforming how you interact with technology.
                    </p>
                    
                    {/* 亮点特性 */}
                    <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        <div className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Intelligent Learning</h3>
                            <p className="text-sm text-gray-400 text-center">Adapts to your workflow patterns</p>
                        </div>
                        
                        <div className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Autonomous Work</h3>
                            <p className="text-sm text-gray-400 text-center">Handles routine tasks automatically</p>
                        </div>
                        
                        <div className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Peak Productivity</h3>
                            <p className="text-sm text-gray-400 text-center">Focus on what matters most</p>
                        </div>
                    </div>
                </div>

                {features.map((feature, index) => (
                    <Feature key={index} {...feature} />
                ))}
            </Container>
        </section>
    )
}
