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

            <main className="mt-52">

                <div className="flex flex-col  items-center justify-center">
                    <Logo className="h-20 w-auto" />
                    <div className="mt-10 flex text-center flex-col items-center max-w-md">
                        <h3 className="text-4xl  font-semibold tracking-tight">
                            Hi , you have successfully connected to Enconvo Account
                        </h3>
                        <div className="text-base  text-gray-600 mt-10">
                            You have successfully connected to Enconvo Account. Now it’s time to
                            open Enconvo to use the new commands of the extension.

                        </div>


                        <div className="flex">
                            <Button onClick={handleOpenApp} className="mt-10 border-2">
                                Open Enconvo
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
