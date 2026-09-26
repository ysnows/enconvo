import Head from 'next/head'
import styles from '@/styles/Home.module.css'

import { Faqs } from '@/components/Faqs'
import { Footer } from '@/components/Footer'
import { Hero } from '@/components/Hero'
import { Pricing } from '@/components/Pricing'
import { Testimonials } from '@/components/Testimonials'
import { AlwaysWithYou } from '@/components/home/AlwaysWithYou'
import { FeatureGrid } from '@/components/home/FeatureGrid'
import { ModelFreedom } from '@/components/home/ModelFreedom'
import { OpenPlatform } from '@/components/home/OpenPlatform'
import { useSectionEffects } from '@/components/home/useSectionEffects'
import { homepageStructuredData, SITE_DESCRIPTION } from '@/data/siteMetadata'

const TITLE = 'Enconvo — AI Assistant & Agent for Mac'
const DESCRIPTION = SITE_DESCRIPTION

export default function Home() {
  const sectionEffectsRef = useSectionEffects()
  return (
    <div className={styles.page} ref={sectionEffectsRef}>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href="https://www.enconvo.com/" />
        <link rel="preload" as="image" href="/posters/app-sidebar.jpg" />
        <link rel="preconnect" href="https://file.enconvo.com" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageStructuredData).replace(/</g, '\\u003c') }} />
      </Head>

      <a href="#main-content" className={styles.skipLink}>Skip to content</a>
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <FeatureGrid />
        <ModelFreedom />
        <OpenPlatform />
        <AlwaysWithYou />
        <Testimonials />
        <Pricing />
        <Faqs />
      </main>
      <Footer />
    </div>
  )
}
