import Head from 'next/head'

import { Faqs } from '@/components/Faqs'
import { Footer } from '@/components/Footer'
import { Hero } from '@/components/Hero'
import { Pricing } from '@/components/Pricing'
import { Testimonials } from '@/components/Testimonials'
import { AlwaysWithYou } from '@/components/home/AlwaysWithYou'
import { FeatureGrid } from '@/components/home/FeatureGrid'
import { ModelFreedom } from '@/components/home/ModelFreedom'
import { OpenPlatform } from '@/components/home/OpenPlatform'

const TITLE = 'Enconvo — The Assistant Your Mac Was Promised | AI Agent for macOS'
const DESCRIPTION =
  'Enconvo is an AI agent that lives across your Mac — it sees your screen, works inside your apps, and actually gets things done. 100+ tools, MCP support, local models, and your own API keys.'

export default function Home() {
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://enconvo.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@enconvo_ai" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
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
    </>
  )
}
