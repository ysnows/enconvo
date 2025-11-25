import clsx from 'clsx'
import { useState } from 'react';
import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { supabase } from '@/lib/supabase'


interface SwirlyDoodleProps {
    className: string
}

function SwirlyDoodle({ className }: SwirlyDoodleProps) {
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
    description: string
    startText?: string
    features: string[]
    featured?: boolean
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
}: PlanProps) {
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
                'group relative flex flex-col rounded-3xl px-6 sm:px-8 transition-all duration-300',
                featured
                    ? 'order-first bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 py-8 lg:order-none scale-105 shadow-2xl shadow-blue-500/25 ring-2 ring-blue-400/20'
                    : 'bg-gradient-to-br from-gray-800/50 via-gray-800/30 to-gray-900/50 py-8 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 hover:shadow-xl hover:shadow-gray-900/20 hover:-translate-y-1'
            )}
        >
            {/* 装饰元素 */}
            <div className={clsx(
                "absolute -top-4 -right-4 w-8 h-8 rounded-full opacity-20 blur-xl",
                featured ? "bg-white" : "bg-blue-500"
            )}></div>

            {/* SAVE 角标 */}
            {originPrice && (
                <div className="absolute right-0 top-0 overflow-hidden w-28 h-28 pointer-events-none rounded-tr-3xl z-10">
                    <div className="absolute rotate-45 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold py-2 w-40 text-center shadow-lg -right-10 top-6">
                        SAVE 50%
                    </div>
                </div>
            )}

            {/* 价格展示 */}
            <div className={clsx(
                "order-first relative overflow-hidden",
                featured && originPrice ? "pt-6" : ""
            )}>
                {featured && (
                    <div className="absolute -top-2 -right-2">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                            Most Popular
                        </div>
                    </div>
                )}

                <div className={clsx(
                    "flex items-baseline gap-3",
                    originPrice ? "mt-2" : ""
                )}>
                    {originPrice && (
                        <span className="font-display text-3xl font-bold line-through text-gray-500">
                            {originPrice}
                        </span>
                    )}
                    <span className={clsx(
                        "font-display text-5xl font-bold tracking-tight",
                        originPrice
                            ? "text-red-500"
                            : featured
                                ? "text-white"
                                : "bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
                    )}>
                        {price}
                    </span>
                </div>
            </div>

            {/* 标题和描述 */}
            <div className="mt-6">
                <h3 className="font-display text-2xl font-bold text-white">{name}</h3>
                <p className={clsx(
                    'mt-1 text-xs leading-relaxed',
                    featured ? 'text-blue-100' : 'text-gray-400'
                )}>
                    {description}
                </p>
            </div>
            {/* 功能列表 */}
            <div className="mt-8 flex-1">
                <ul
                    role="list"
                    className="space-y-4"
                >
                    {features.map((feature) => (
                        <li key={feature} className="flex items-start group/item">
                            <div className={clsx(
                                "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 transition-all duration-200",
                                featured
                                    ? "bg-blue-400/20 group-hover/item:bg-blue-400/30"
                                    : "bg-gray-700/50 group-hover/item:bg-blue-500/20"
                            )}>
                                <CheckIcon className={clsx(
                                    "w-3 h-3 transition-colors duration-200",
                                    featured
                                        ? 'text-blue-200 group-hover/item:text-white'
                                        : 'text-blue-400 group-hover/item:text-blue-300'
                                )} />
                            </div>
                            <span className={clsx(
                                "ml-4 text-sm leading-relaxed transition-colors duration-200",
                                featured
                                    ? 'text-blue-100 group-hover/item:text-white'
                                    : 'text-gray-300 group-hover/item:text-white'
                            )}>
                                {feature}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
            {/* 按钮区域 */}
            <div className="mt-8">
                <Button
                    onClick={handleClick}
                    variant={featured ? 'solid' : 'outline'}
                    color="white"
                    className={clsx(
                        "w-full py-4 text-base font-semibold transition-all duration-300 transform",
                        featured
                            ? "bg-white text-blue-700 hover:bg-blue-50 hover:scale-105 shadow-xl shadow-white/10"
                            : "border-2 border-blue-500 text-white hover:bg-blue-500 hover:border-blue-400 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20"
                    )}
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
                                <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </>
                        )}
                    </span>
                </Button>
            </div>
        </section>
    );
}

export function Pricing() {
    return (
        <section
            id="pricing"
            aria-label="Pricing"
            className="bg-black py-20 sm:py-32"
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

                    {/* Black Friday 活动提示 */}
                    <div className="mt-8 inline-flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                            <span className="text-white font-bold text-lg">🔥 Black Friday Sale</span>
                        </div>
                        <div className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-lg animate-bounce">
                            50% OFF - Limited Time!
                        </div>
                    </div>
                </div>

                {/* 主要价格卡片区域 */}
                <div className="mt-16 ">
                    <div className="grid max-w-7xl mx-auto grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3 2xl:gap-8">

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
                            name="Premium"
                            originPrice="$99"
                            price="$49.5"
                            lookupKey={'premium'}
                            description="30-day Money Back Guarantee"
                            startText="Buy License"
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
                            originPrice="$49"
                            price="$24.5"
                            lookupKey={'standard'}
                            description="30-day Money Back Guarantee"
                            startText="Buy License"
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


                    </div>

                    <div className="grid max-w-7xl mx-auto grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3 2xl:gap-8 mt-20">

                        <Plan
                            name="Cloud Premium"
                            price="$10/Monthly"
                            lookupKey={'monthly'}
                            description="All Premium features, No need your own apikeys"
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
                </div>
            </Container>
        </section>
    )
}
