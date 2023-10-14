import Head from 'next/head'
import Link from 'next/link'

import {ReloadIcon, ArrowTopRightIcon, ExclamationTriangleIcon} from "@radix-ui/react-icons"
import {Icons} from "@/components/icons"

import {Button} from "@/components/ui/button"


import {Logo} from '@/components/Logo'
import {SUPABASE_ANON_KEY, SUPABASE_URL} from "@/utils/app/const";
import {useState} from "react";
import {createClient} from "@supabase/supabase-js";
import {useRouter} from "next/navigation";
import {Input} from "@/components/ui/input";
import * as React from "react";
import {createClientComponentClient} from "@supabase/auth-helpers-nextjs";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {NativeRouter} from "@/utils/app/native_router";
import {getEmailLink} from "@/utils/app/email_link";

export default function RegisterSuccess({email}) {

    const openEmail = () => {
        window.open(getEmailLink(email))
    }

    return (
        <>
            <Head>
                <title>Sign Up Success - EnConvo</title>
                <meta
                    name="description"
                    content="you can use it to call AI anytime, anywhere in the MacOS system. You can also integrate AI into your existing workflow through the  plugin system, giving your workflow an AI brain."
                />
            </Head>

            <main className="mt-52">

                <div className="flex flex-col  items-center justify-center">
                    <Logo className="h-20 w-auto"/>
                    <div className="mt-10 flex text-center flex-col items-center max-w-md">
                        <h3 className="text-4xl  font-semibold tracking-tight">
                            Check your email
                        </h3>
                        <div className="text-base  text-gray-600 mt-10">
                            We've sent you a login link.

                            Check your inbox at yong531315@gmail.com to login.
                        </div>

                        <Button onClick={openEmail} className="mt-10 border-2 ">Open
                            Email</Button>
                    </div>
                </div>
            </main>
        </>
    )
}
