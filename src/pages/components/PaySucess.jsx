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


export default function PaySuccess({ handleOpenApp }) {
    useEffect(() => {
        // Trigger confetti effect when component mounts
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(() => {
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

        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <Head>
                <title>Pay Success - EnConvo</title>
                <meta
                    name="description"
                    content="you can use it to call AI anytime, anywhere in the MacOS system. You can also integrate AI into your existing workflow through the  plugin system, giving your workflow an AI brain."
                />
            </Head>

            <main className="mt-52">

                <div className="flex flex-col  items-center justify-center">
                    <Logo className="h-20 w-auto" />
                    <div className="mt-10 flex text-center flex-col items-center max-w-3xl">
                        <h3 className="text-4xl  font-semibold tracking-tight">
                        Congratulations! You have successfully purchased Enconvo.
                        </h3>
                        <div className="text-base  text-gray-600 mt-10">
                            You have successfully buy Enconvo Premium. Now it’s time to
                            connect Enconvo to use all the awesome features.

                        </div>

                        <div className="flex">
                            <Button onClick={handleOpenApp} className="mt-10 border-2">
                                Go To Connect Enconvo
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
