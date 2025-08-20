import clsx from 'clsx'
import { useState } from 'react';
import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { supabase } from '@/lib/supabase'


function SwirlyDoodle({ className }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 281 40"
            className={className}
            preserveAspectRatio="none"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M240.172 22.994c-8.007 1.246-15.477 2.23-31.26 4.114-18.506 2.21-26.323 2.977-34.487 3.386-2.971.149-3.727.324-6.566 1.523-15.124 6.388-43.775 9.404-69.425 7.31-26.207-2.14-50.986-7.103-78-15.624C10.912 20.7.988 16.143.734 14.657c-.066-.381.043-.344 1.324.456 10.423 6.506 49.649 16.322 77.8 19.468 23.708 2.65 38.249 2.95 55.821 1.156 9.407-.962 24.451-3.773 25.101-4.692.074-.104.053-.155-.058-.135-1.062.195-13.863-.271-18.848-.687-16.681-1.389-28.722-4.345-38.142-9.364-15.294-8.15-7.298-19.232 14.802-20.514 16.095-.934 32.793 1.517 47.423 6.96 13.524 5.033 17.942 12.326 11.463 18.922l-.859.874.697-.006c2.681-.026 15.304-1.302 29.208-2.953 25.845-3.07 35.659-4.519 54.027-7.978 9.863-1.858 11.021-2.048 13.055-2.145a61.901 61.901 0 0 0 4.506-.417c1.891-.259 2.151-.267 1.543-.047-.402.145-2.33.913-4.285 1.707-4.635 1.882-5.202 2.07-8.736 2.903-3.414.805-19.773 3.797-26.404 4.829Zm40.321-9.93c.1-.066.231-.085.29-.041.059.043-.024.096-.183.119-.177.024-.219-.007-.107-.079ZM172.299 26.22c9.364-6.058 5.161-12.039-12.304-17.51-11.656-3.653-23.145-5.47-35.243-5.576-22.552-.198-33.577 7.462-21.321 14.814 12.012 7.205 32.994 10.557 61.531 9.831 4.563-.116 5.372-.288 7.337-1.559Z"
            />
        </svg>
    )
}

function CheckIcon({ className }) {
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

function Plan({
    name,
    price,
    lookupKey,
    originPrice,
    description,
    startText = "Get started",
    features,
    featured = false
}) {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        try {
            setIsLoading(true);
            // 检查用户是否已登录
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
                // 如果未登录，保存当前的 lookupKey 到 URL 参数，并重定向到登录页面
                const returnUrl = `/pricing?plan=${lookupKey}`;
                window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
                return;
            }
            console.log("user email", session.user.email, window.endorsely_referral)

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

            console.log("response.status", response.status);

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
            className={clsx(
                'flex flex-col rounded-3xl px-6 sm:px-8',
                featured ? 'order-first bg-blue-600 py-8 lg:order-none' : 'lg:py-8'
            )}
        >
            <h3 className="mt-5 font-display text-lg text-white">{name}</h3>
            <p
                className={clsx(
                    'mt-2 text-base',
                    featured ? 'text-white' : 'text-slate-400'
                )}
            >
                {description}
            </p>
            <p className="order-first font-display text-5xl font-light tracking-tight text-white">
                {originPrice &&
                    <>
                        <span className='line-through text-gray-700'>{originPrice}</span>
                        &nbsp;
                    </>
                }
                {price}
            </p>
            <ul
                role="list"
                className={clsx(
                    'order-last mt-10 flex flex-col gap-y-3 text-sm',
                    featured ? 'text-white' : 'text-slate-200'
                )}
            >
                {features.map((feature) => (
                    <li key={feature} className="flex">
                        <CheckIcon className={featured ? 'text-white' : 'text-slate-400'} />
                        <span className="ml-4">{feature}</span>
                    </li>
                ))}
            </ul>
            <Button
                onClick={handleClick}
                variant={featured ? 'solid' : 'outline'}
                color="white"
                className="mt-8"
                disabled={isLoading}
            >
                {isLoading ? 'Going to checkout...' : startText}
            </Button>
        </section>
    );
}

export function Pricing() {
    return (
        <section
            id="pricing"
            aria-label="Pricing"
            className="bg-slate-900 py-20 sm:py-32"
        >
            <Container>
                <div className="md:text-center">
                    <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl">
                        <span className="relative whitespace-nowrap">
                            <SwirlyDoodle className="absolute left-0 top-1/2 h-[1em] w-full fill-blue-400" />
                            <span className="relative">Simple pricing,</span>

                        </span>
                        {' '}
                        for everyone.
                    </h2>
                    <p className="mt-4 text-lg text-slate-400">
                        No matter who you are, our software is designed to meet your requirements.
                    </p>

                    <div className='mt-4'>
                        <span className="text-white font-semibold">DeepSeek R1、DeepSeek V3</span>
                        <span className="ml-2 py-1 px-3 bg-red-600 font-bold text-white rounded-sm border-1 border-dashed border-red-600">
                            Free Unlimited Use
                        </span>
                        {/* <span className="text-white font-semibold"> if you buy today.</span> */}
                    </div>


                </div>
                <div
                    className="-mx-4 mt-16 grid max-w-2xl grid-cols-1 gap-y-10 sm:mx-auto lg:-mx-8 lg:max-w-none lg:grid-cols-3 xl:mx-0 xl:gap-x-8">

                    <Plan
                        name="Free"
                        price="FREE"
                        lookupKey={'free'}
                        description="Lifetime access to all basic features."
                        href="https://api.enconvo.com/app/download"
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
                        featured
                        name="Premium"
                        price="$99"
                        lookupKey={'premium'}
                        description="Most popular."
                        href="https://buy.stripe.com/5kAdSm99j0cRgNycMV"
                        features={[
                            '150,000 Points one-time bonus', // One-time bonus points for new users
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

                    <Plan
                        name="Standard"
                        price="$49"
                        lookupKey={'standard'}
                        description="Lifetime access to all features."
                        href="https://buy.stripe.com/aEU6pUbhrf7L0OAfZ6"
                        features={[
                            '50,000 Points one-time bonus', // One-time bonus points for new users
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
                        name="Cloud Premium"
                        price="$10/Monthly"
                        lookupKey={'monthly'}
                        description="All Premium features, No need your own apikeys"
                        href="https://buy.stripe.com/00g15A2KVcZDbteaEO"
                        startText={'Get started'}
                        features={[
                            '500,000 Points/Month',
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
                        featured
                        name="Cloud Premium"
                        price="$96/Yearly"
                        lookupKey={'yearly'}
                        description="All Premium features, No need your own apikeys"
                        href="https://buy.stripe.com/bIY4hM5X71gVfJu4gr"
                        startText={'Get started'}
                        features={[
                            '500,000 Points/Month',
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
                        href="mailto:support@enconvo.com"
                        lookupKey={'teams'}
                        startText={'Contact Sales'}
                        features={[
                            // Core features from Premium
                            'All Premium Features',
                            // Enterprise specific features
                            'Private Deployment Options',
                            'Custom Tool & Agent Deployment',
                            'Custom Workflow Development',
                            'Priority Support',
                            'Advanced Security Controls',
                            'Team Management Features'
                        ]}
                    />


                </div>
            </Container>
        </section>
    )
}
