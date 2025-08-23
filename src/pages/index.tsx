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
          content="EnConvo - your AI Agent Launcher that revolutionizes productivity. With instant access, automate your daily tasks effortlessly. Our intelligent AI Agent system, powered by 150+ built-in tools and MCP(Model Context Protocol) support, learns and adapts to your workflow. Experience seamless automation and enhanced productivity with the most versatile AI assistant for macOS, 
          EnConvo is a powerful AI Agent Launcher that transforms your macOS experience. Our comprehensive feature set includes:

          • Advanced AI Agent Mode (Coming Soon)
          Experience our revolutionary AI assistant with advanced capabilities including memory retention, context awareness, and seamless integration with all EnConvo features and plugins. Leverage your knowledge base to effortlessly complete complex tasks.

          • Extensive Model Provider Support
          Connect with leading AI models including OpenAI, DeepSeek R1, Gemini, and Claude. For enhanced privacy, run local models through Ollama and LM Studio integration.

          • Custom Workflow Automation
          Design and implement personalized workflows by combining system features, tools, and existing workflows. Access your custom automations instantly via SmartBar, PopBar, or customizable hotkeys.

          • Intelligent Context Awareness
          Automatically detect and utilize contextual information from active applications, selected text, Finder files, and browser content. Our smart system recommends relevant tools and plugins based on your current context, optimizing your workflow efficiency.

          • Advanced Voice Input Integration
          Transform your system-wide voice input experience with customizable hotkeys, press-and-hold shortcuts, and AI-powered post-processing. Choose from premium providers including Microsoft, AssemblyAI, Deepgram, Groq, and local Whisper models.

          • AI-Enhanced Web Search
          Elevate your research with AI-powered web search capabilities. Integration with Google, Bing, Tavily, SerpAPI, You Search, and Exa Search delivers comprehensive results without manual browsing.

          • Interactive Document Analysis
          Chat naturally with your documents using advanced AI processing. Compatible with PDF, Word, Excel, and various other file formats for seamless document interaction.

          • Creative AI Tools
          Generate stunning images through integration with OpenAI, Stability AI, and other leading providers. Convert text to natural-sounding speech using OpenAI, ElevenLabs, and additional TTS services.

          • Extensive Plugin Ecosystem
          Access a rich collection of plugins supporting Workflows, Context Awareness, Voice Input, AI Search, Document Chat, Image Generation, TTS, and more, continuously expanding to meet your needs.
          "
        />
      </Head>

      {/* <Header /> */}
      <main>


        <Hero />
        <PrimaryFeatures />
        {/* <SecondaryFeatures /> */}
        {/* <CallToAction /> */}
        <Testimonials />
        <Pricing />
        <Faqs />
      </main>
      <Footer />
    </>
  )
}
