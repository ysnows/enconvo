import Head from 'next/head'

import { CallToAction } from '@/components/CallToAction'
import { Faqs } from '@/components/Faqs'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { Pricing } from '@/components/Pricing'
import { PrimaryFeatures } from '@/components/PrimaryFeatures'
import { SecondaryFeatures } from '@/components/SecondaryFeatures'
import { Testimonials } from '@/components/Testimonials'
import { Button } from "@/components/Button";

export default function Home() {
  return (
    <>
      <Head>
        <title>EnConvo - Seamless Ai Assistant</title>
        <meta
          name="description"
          content="ou can use it to call AI anytime, anywhere in the MacOS system. You can also integrate AI into your existing workflow through the  plugin system, giving your workflow an AI brain."
        />
      </Head>
      {/*<Header />*/}
      <main>


        <Hero />
        <PrimaryFeatures />
        {/* <SecondaryFeatures /> */}
        {/* <CallToAction /> */}
        {/* <Testimonials /> */}
        <Pricing />
        <Faqs />
      </main>
      <Footer />
    </>
  )
}
