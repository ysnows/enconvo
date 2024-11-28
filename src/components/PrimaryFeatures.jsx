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
            className="relative overflow-hidden bg-gray-900 pb-28 sm:pt-20 pt-6 sm:py-32"
        >
            <Container className="relative">
                <div className="max-w-2xl md:mx-auto md:text-center xl:max-w-none">
                    <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl md:text-5xl">
                        Revolutionizing Human-Computer Interaction
                    </h2>
                    <p className="mt-6 text-lg tracking-tight text-blue-100">
                        We are dedicated to creating an AI OS, developing core capabilities and diverse tools centered around artificial intelligence. Our ultimate goal is to enable AI to autonomously operate computers, liberating humans from routine tasks and unlocking unprecedented potential.
                    </p>
                </div>

                {features.map((feature, index) => (
                    <Feature key={index} {...feature} />
                ))}
            </Container>
        </section>
    )
}
