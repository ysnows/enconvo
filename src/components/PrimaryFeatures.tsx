import { useEffect, useState } from 'react'
import { Container } from '@/components/Container'
import { Feature } from './features/Feature'
import { features } from '@/data/features'

export function PrimaryFeatures() {
    let [_, setTabOrientation] = useState('horizontal')

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

                {features.map((feature, index) => (
                    <Feature key={index} {...feature} />
                ))}
            </Container>
        </section>
    )
}
