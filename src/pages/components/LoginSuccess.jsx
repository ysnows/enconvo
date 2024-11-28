import Head from 'next/head'

import { Button } from "@/components/ui/button"
import { useState, useEffect } from 'react'

import {
    createClientComponentClient
} from '@supabase/auth-helpers-nextjs'

import { Logo } from '@/components/Logo'
import * as React from "react";
import { User } from "@supabase/supabase-js";


export default function LoginSuccess({ handleOpenApp, user }) {

    return (
        <>
            <Head>
                <title>Sign In Success - EnConvo</title>
                <meta
                    name="description"
                    content="you can use it to call AI anytime, anywhere in the MacOS system. You can also integrate AI into your existing workflow through the  plugin system, giving your workflow an AI brain."
                />
            </Head>

            <main className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A1A]">
                <div className="w-full max-w-[480px] space-y-8 px-4">
                    <div className="flex flex-col items-center space-y-8">
                        <Logo className="h-16 w-auto" />
                        <div className="text-center space-y-4">
                            <h3 className="text-3xl font-medium tracking-tight text-white">
                                Hi, you have successfully connected to Enconvo
                            </h3>
                            <p className="text-base text-[#888888]">
                                You have successfully connected to Enconvo Account. Now it&apos;s time to
                                open Enconvo to use the new commands of the extension.
                            </p>
                        </div>

                        <Button 
                            onClick={handleOpenApp} 
                            className="w-full max-w-[200px] bg-[#E5E5E5] hover:bg-[#D4D4D4] text-[#1A1A1A] font-medium h-10 rounded-xl transition-all duration-200"
                        >
                            Open Enconvo
                        </Button>
                    </div>
                </div>
            </main>
        </>
    )
}
