import Head from 'next/head'

import { Faqs } from '@/components/Faqs'
import { Footer } from '@/components/Footer'
import { Hero } from '@/components/Hero'
import { Pricing } from '@/components/Pricing'
import { PrimaryFeatures } from '@/components/PrimaryFeatures'
import { Testimonials } from '@/components/Testimonials'

export default function Home() {
  return (
    <>
      <Head>
        <title>EnConvo - AI Agent Launcher for macOS</title>
        <meta
          name="description"
          content="EnConvo is an always-on AI companion for macOS. Context-aware of your screen and apps, with 100+ built-in tools, MCP support, workflows, and local model privacy."
        />
        <meta property="og:title" content="EnConvo - AI Agent Launcher for macOS" />
        <meta property="og:description" content="The always-on AI companion that knows you best. Context-aware, 100+ tools, MCP support, local model privacy." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://enconvo.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@enconvo_ai" />
        <meta name="twitter:title" content="EnConvo - AI Agent Launcher for macOS" />
        <meta name="twitter:description" content="The always-on AI companion that knows you best. Context-aware, 100+ tools, MCP support, local model privacy." />
      </Head>

      <main>
        <Hero />
        <PrimaryFeatures />
        <Testimonials />
        <Pricing />
        <Faqs />
      </main>
      <Footer />
    </>
  )
}
