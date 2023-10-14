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

export default function LoginSuccess() {

    const supabase = createClientComponentClient()

    const [email, setEmail] = useState('')


    return (
        <>
            <Head>
                <title>Sign In Success - EnConvo</title>
                <meta
                    name="description"
                    content="you can use it to call AI anytime, anywhere in the MacOS system. You can also integrate AI into your existing workflow through the  plugin system, giving your workflow an AI brain."
                />
            </Head>

            <main>

                <div className="">
                    <div className="flex flex-col items-center">
                        <Link className="mt-28" href="/" aria-label="Home">
                            <Logo className="h-20 w-auto"/>
                        </Link>
                        <div className="mt-10 flex flex-col items-center">
                            <h3 className="text-xl font-semibold tracking-tight">
                                Log in to your Enconvo account
                            </h3>
                        </div>
                    </div>


                </div>
            </main>
        </>
    )
}
