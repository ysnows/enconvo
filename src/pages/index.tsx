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

const TITLE = 'Enconvo — The Assistant Your Mac Was Promised | AI Agent for macOS'
const DESCRIPTION =
  'Enconvo is an AI agent that lives across your Mac — it sees your screen, works inside your apps, and actually gets things done. 100+ tools, MCP support, local models, and your own API keys.'
const SHARE_TITLE = 'Enconvo — The assistant your Mac was promised.'
const SHARE_DESCRIPTION =
  'An AI agent that understands your screen and works in your Mac apps. Organize files, write, research, and get things done with Enconvo.'
const SHARE_IMAGE = 'https://www.enconvo.com/og/enconvo-mac-agent-v1.jpg'
const SHARE_IMAGE_ALT =
  'Enconvo — The assistant your Mac was promised. A native AI sidebar organizes files alongside Finder, framed by blue light ribbons.'

export default function Home() {
  const sectionEffectsRef = useSectionEffects()
  return (
    <div className={styles.page} ref={sectionEffectsRef}>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href="https://www.enconvo.com/" />
        <meta property="og:title" content={SHARE_TITLE} />
        <meta property="og:description" content={SHARE_DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.enconvo.com/" />
        <meta property="og:site_name" content="Enconvo" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content={SHARE_IMAGE} />
        <meta property="og:image:secure_url" content={SHARE_IMAGE} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={SHARE_IMAGE_ALT} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@enconvo_ai" />
        <meta name="twitter:title" content={SHARE_TITLE} />
        <meta name="twitter:description" content={SHARE_DESCRIPTION} />
        <meta name="twitter:image" content={SHARE_IMAGE} />
        <meta name="twitter:image:alt" content={SHARE_IMAGE_ALT} />
      </Head>

      <main>
        <Hero />
        <ModelFreedom />
        <OpenPlatform />
        <AlwaysWithYou />
        <FeatureGrid />
        <Testimonials />
        <Pricing />
        <Faqs />
      </main>
      <Footer />
    </div>
  )
}
