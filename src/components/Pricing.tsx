import clsx from 'clsx'
import { useEffect, useState } from 'react';
import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { supabase } from '@/lib/supabase'
import { fetchPricingCatalog } from '@/lib/cloud-pricing'

interface CheckIconProps {
  className: string
}

function CheckIcon({ className }: CheckIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={clsx(
        'h-6 w-6 flex-none fill-current stroke-current',
        className
      )}
    >
      <path
        d="M9.307 12.248a.75.75 0 1 0-1.114 1.004l1.114-1.004ZM11 15.25l-.557.502a.75.75 0 0 0 1.15-.043L11 15.25Zm4.844-5.041a.75.75 0 0 0-1.188-.918l1.188.918Zm-7.651 3.043 2.25 2.5 1.114-1.004-2.25-2.5-1.114 1.004Zm3.4 2.457 4.25-5.5-1.187-.918-4.25 5.5 1.188.918Z"
        strokeWidth={0}
      />
      <circle
        cx={12}
        cy={12}
        r={8.25}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface PlanProps {
  name: string
  price: string
  lookupKey: string
  originPrice?: string
  savePercent?: string
  description: string
  startText?: string
  detailsHref?: string
  features: string[]
  featured?: boolean
}

function Plan({
  name,
  price,
  lookupKey,
  originPrice,
  savePercent = "50%",
  description,
  startText = "Get started",
  detailsHref,
  features,
  featured = false
}: PlanProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      if (lookupKey === "free") {
        window.location.href = "https://api.enconvo.com/app/download";
        return;
      }
      if (lookupKey === "teams") {
        window.location.href = "mailto:support@enconvo.com";
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        const returnUrl = `/pricing?plan=${lookupKey}`;
        window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
        return;
      }

      const response = await fetch('/api/subscription/checkout_sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lookupKey,
          email: session.user.email,
          endorsely_referral: window.endorsely_referral
        }),
      });

      if (response.status === 200) {
        const data = await response.json()
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        const error = await response.json();
        console.error('Payment error:', error);
      }
    } catch (error) {
      console.error('Error initiating checkout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      className="group relative flex flex-col rounded-lg px-6 sm:px-8 py-8 transition-colors bg-surface-card border border-hairline hover:border-hairline-strong"
    >
      {originPrice && (
        <div className="absolute right-0 top-0 overflow-hidden w-28 h-28 pointer-events-none rounded-tr-lg z-10">
          <div className="absolute rotate-45 bg-signal-red text-white text-sm font-bold py-2 w-40 text-center shadow-lg -right-10 top-6">
            SAVE {savePercent}
          </div>
        </div>
      )}

      <div className="order-first relative">
        <div className="flex flex-col gap-2">
          {originPrice && (
            <span className="font-display text-xl font-bold line-through text-content-ash">
              {originPrice}
            </span>
          )}
          <span className={clsx(
            "font-display text-4xl font-bold tracking-tight",
            originPrice ? "text-signal-red" : "text-content"
          )}>
            {price}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-display text-2xl font-bold text-content">{name}</h3>
        <p className="mt-1 text-xs leading-relaxed text-content-muted">
          {description}
        </p>
      </div>

      <div className="mt-8 flex-1">
        <ul role="list" className="space-y-4">
          {features.map((feature) => (
            <li key={feature} className="flex items-start group/item">
              <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 bg-surface-elevated">
                <CheckIcon className="w-3 h-3 text-signal-blue" />
              </div>
              <span className="ml-4 text-sm leading-relaxed text-content-body">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <Button
          onClick={handleClick}
          variant="outline"
          color="white"
          className="w-full py-4 text-base font-semibold transition-colors border border-hairline text-content hover:bg-white hover:text-canvas"
          disabled={isLoading}
        >
          <span className="flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Going to checkout...
              </>
            ) : (
              <>
                {startText}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </span>
        </Button>
        {detailsHref && (
          <a href={detailsHref} className="mt-3 block text-center text-xs text-content-muted transition hover:text-signal-blue">
            See model &amp; service rates
          </a>
        )}
      </div>
    </section>
  );
}

export function Pricing() {
  const [cloudAllowance, setCloudAllowance] = useState<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetchPricingCatalog(controller.signal)
      .then((catalog) => setCloudAllowance(catalog.cloudPolicy.cloudPlanAllowancePoints))
      .catch((error) => {
        if (error.name !== 'AbortError') setCloudAllowance(null)
      })
    return () => controller.abort()
  }, [])

  const cloudAllowanceFeature = cloudAllowance === null
    ? 'Monthly Cloud point allowance'
    : `${new Intl.NumberFormat('en-US').format(cloudAllowance)} Points/Month`

  return (
    <section
      id="pricing"
      aria-label="Pricing"
      className="bg-canvas py-20 sm:py-32"
    >
      <Container>
        <div className="md:text-center">
          <h2 className="font-display text-3xl tracking-tight text-content sm:text-4xl">
            Simple pricing, for everyone.
          </h2>
          <p className="mt-4 text-lg text-content-muted">
            No matter who you are, our software is designed to meet your requirements.
          </p>
        </div>

        <div className="mt-16">
          <div className="grid max-w-7xl mx-auto grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3 2xl:gap-10">
            <Plan
              name="Free"
              price="FREE"
              lookupKey={'free'}
              description="Lifetime access to all basic features."
              startText={'Download'}
              features={[
                '10 uses/day',
                'Knowledge Base',
                'Workflow',
                'Voice Input Method',
                'Context Awareness',
                'Live closed captions',
                'Seamless access AI via SmartBar',
                'PopBar',
                'AI Web Search',
                'Image Generation',
                'Text-to-Speech (TTS)',
                'Chat With Documents',
                'Chat With Webpage',
                'Use Local LLM (Ollama,LMStudio) For Privacy',
                'Ultimate Use of OCR',
                'Extension system',
                'More Than 100+ Features',
              ]}
            />

            <Plan
              name="Standard"
              price="$49"
              lookupKey={'standard'}
              description="30-day Money Back Guarantee"
              startText="Buy License"
              features={[
                '50,000 Points one-time bonus',
                'Unlimited AI use with your API key',
                '1 years free updates',
                '1 MacOS Devices',
                'Knowledge Base',
                'Workflow',
                'Voice Input Method',
                'Context Awareness',
                'Live closed captions',
                'Seamless access AI via SmartBar',
                'PopBar',
                'AI Web Search',
                'Image Generation',
                'Text-to-Speech (TTS)',
                'Chat With Documents',
                'Chat With Webpage',
                'Use Local LLM (Ollama,LMStudio) For Privacy',
                'Ultimate Use of OCR',
                'Extension system',
                'More Than 100+ Features',
              ]}
            />

            <Plan
              name="Premium"
              price="$99"
              lookupKey={'premium'}
              description="30-day Money Back Guarantee"
              startText="Buy License"
              features={[
                '150,000 Points one-time bonus',
                'Unlimited AI use with your API key',
                '3 MacOS Devices',
                'Lifetime free updates',
                'Knowledge Base',
                'Workflow',
                'Voice Input Method',
                'Context Awareness',
                'Live closed captions',
                'Seamless access AI via SmartBar',
                'PopBar',
                'AI Web Search',
                'Image Generation',
                'Text-to-Speech (TTS)',
                'Chat With Documents',
                'Chat With Webpage',
                'Use Local LLM (Ollama,LMStudio) For Privacy',
                'Ultimate Use of OCR',
                'Extension system',
                'More Than 100+ Features',
              ]}
            />
          </div>

          <div className="grid max-w-7xl mx-auto grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3 2xl:gap-10 mt-20">
            <Plan
              name="Cloud Plan"
              price="$10/Monthly"
              lookupKey={'monthly'}
              description="All Premium features with managed Cloud models and services."
              detailsHref="/cloud-pricing"
              startText={'Get started'}
              features={[
                cloudAllowanceFeature,
                'Unlimited Knowledge Bases',
                '5 MacOS Devices',
                'No Need Your Own ApiKey',
                'Knowledge Base',
                'Workflow',
                'Voice Input Method',
                'Context Awareness',
                'Live closed captions',
                'Seamless access AI via SmartBar',
                'PopBar',
                'AI Web Search',
                'Image Generation',
                'Text-to-Speech (TTS)',
                'Chat With Documents',
                'Chat With Webpage',
                'Use Local LLM (Ollama,LMStudio) For Privacy',
                'Ultimate Use of OCR',
                'Extension system',
                'More Than 100+ Features',
              ]}
            />

            <Plan
              name="Cloud Plan"
              price="$96/Yearly"
              lookupKey={'yearly'}
              description="All Premium features with managed Cloud models and services."
              detailsHref="/cloud-pricing"
              startText={'Get started'}
              features={[
                cloudAllowanceFeature,
                'Unlimited Knowledge Bases',
                '5 MacOS Devices',
                'No Need Your Own ApiKey',
                'Knowledge Base',
                'Workflow',
                'Voice Input Method',
                'Context Awareness',
                'Live closed captions',
                'Seamless access AI via SmartBar',
                'PopBar',
                'AI Web Search',
                'Image Generation',
                'Text-to-Speech (TTS)',
                'Chat With Documents',
                'Chat With Webpage',
                'Use Local LLM (Ollama,LMStudio) For Privacy',
                'Ultimate Use of OCR',
                'Extension system',
                'More Than 100+ Features',
              ]}
            />

            <Plan
              name="Teams"
              price="Teams"
              description="Custom solutions for organizations with advanced needs"
              lookupKey={'teams'}
              startText={'Contact Sales'}
              features={[
                'All Premium Features',
                'Private Deployment Options',
                'Custom Tool & Agent Deployment',
                'Custom Workflow Development',
                'Priority Support',
                'Advanced Security Controls',
                'Team Management Features'
              ]}
            />
          </div>
        </div>
      </Container>
    </section>
  )
}
