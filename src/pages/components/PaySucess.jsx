import Head from 'next/head'

import { Button } from "@/components/ui/button"
import { useState, useEffect } from 'react'

import {
    createClientComponentClient
} from '@supabase/auth-helpers-nextjs'

import { Logo } from '@/components/Logo'
import * as React from "react";
import { User } from "@supabase/supabase-js";
import confetti from 'canvas-confetti';
import { useRouter } from 'next/router'


export default function PaySuccess({ handleOpenApp }) {
    const router = useRouter();
    const isSuccess = router.query.success === 'true';
    const isCanceled = router.query.canceled === 'true';
    const from = router.query.from;
    const isTopUpPoints = from === 'points_top_up';
    const successTipText = isTopUpPoints ? 'Thank you for your purchase! You will receive your points in your account shortly.' : 'Thank you for your purchase! You can now start using Enconvo premium features.';

    useEffect(() => {
        if (isSuccess) {
            // Trigger confetti effect when payment is successful
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            function randomInRange(min, max) {
                return Math.random() * (max - min) + min;
            }

            const interval = setInterval(function() {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti(Object.assign({}, defaults, {
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                }));
                confetti(Object.assign({}, defaults, {
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                }));
            }, 250);
        }
    }, [isSuccess]);

    return (
        <>
            <Head>
                <title>Payment {isSuccess ? 'Successful' : 'Cancelled'} - Enconvo</title>
                <meta
                    name="description"
                    content={isSuccess ? "Payment successful for Enconvo" : "Payment cancelled for Enconvo"}
                />
            </Head>

            <main className="relative min-h-screen bg-gray-900">
                <div className="relative isolate overflow-hidden">
                    <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
                        <div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8">
                            <div className="mt-24 sm:mt-32 lg:mt-16">
                                <a href="#" className="inline-flex space-x-6">
                                    <span className={`rounded-full px-3 py-1 text-sm font-semibold leading-6 ring-1 ring-inset ${
                                        isSuccess 
                                            ? 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/20' 
                                            : 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20'
                                    }`}>
                                        {isSuccess ? 'Payment Success' : 'Payment Cancelled'}
                                    </span>
                                </a>
                            </div>
                            <h1 className="mt-10 text-4xl font-bold tracking-tight text-white sm:text-6xl">
                                {isSuccess 
                                    ? 'Thank you for your purchase!' 
                                    : 'Payment Cancelled'}
                            </h1>
                            <p className="mt-6 text-lg leading-8 text-gray-300">
                                {isSuccess 
                                    ? successTipText
                                    : 'Your payment was cancelled. If you experienced any issues, please try again or contact our support team.'}
                            </p>
                            <div className="flex gap-4 mt-10">
                                {isSuccess ? (
                                    <Button onClick={handleOpenApp} className="border-2">
                                        Go To Connect Enconvo
                                    </Button>
                                ) : (
                                    <>
                                        <Button onClick={() => router.push('/')} className="border-2">
                                            Return to Home
                                        </Button>
                                        <Button onClick={() => router.push('/#pricing')} className="bg-indigo-600 hover:bg-indigo-500">
                                            Try Again
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl xl:-top-6" aria-hidden="true">
                        <div
                            className={`aspect-[1155/678] w-[72.1875rem] opacity-30 ${
                                isSuccess 
                                    ? 'bg-gradient-to-tr from-[#ff80b5] to-[#9089fc]'
                                    : 'bg-gradient-to-tr from-[#ffd280] to-[#fc9890]'
                            }`}
                            style={{
                                clipPath:
                                    'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                            }}
                        />
                    </div>
                </div>
            </main>
        </>
    )
}
