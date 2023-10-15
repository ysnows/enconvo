import Head from 'next/head'

import {Button} from "@/components/ui/button"


import {Logo} from '@/components/Logo'
import * as React from "react";
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
                            We&apos;ve sent you a login link.

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
