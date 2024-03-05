import {
    createClientComponentClient
} from '@supabase/auth-helpers-nextjs'
// import {useRouter} from "next/navigation";
import { useState } from "react";
import Head from 'next/head'
import Link from 'next/link'

import { ReloadIcon, ArrowTopRightIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons"

import { Button } from "@/components/ui/button"


import { Logo } from '@/components/Logo'
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ResetPasswordStepOne() {
    // 获取url参数

    const supabase = createClientComponentClient()

    // const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [email, setEmail] = useState('')
    const [emailIsLoading, setEmailIsLoading] = React.useState(false)

    async function signUp() {
        // check if email is valid
        if (!email || !email.includes('@')) {
            alert('Please enter a valid email')
            return
        }

        setEmailIsLoading(true)
        const { data, error } = await supabase.auth.resetPasswordForEmail({
            email: email,
            options: {
                emailRedirectTo: 'https://www.enconvo.com/reset_password?from=app'
            }
        })

        if (error) {
            setError(error.message)
            setEmailIsLoading(false)
            return
        }

        console.log(data)

        // NativeRouter.login(data.session.access_token, data.session.refresh_token)
        setLoginState("success")

        setEmailIsLoading(false)
        // setContinueLogin(true)
    }


    return (
        <>
            <Head>
                <title>Reset Password - EnConvo</title>
                <meta
                    name="description"
                    content="you can use it to call AI anytime, anywhere in the MacOS system. You can also integrate AI into your existing workflow through the  plugin system, giving your workflow an AI brain."
                />
            </Head>

            <main>

                <div className="">
                    <div className="flex flex-col items-center">
                        <Link className="mt-28" href="/" aria-label="Home">
                            <Logo className="h-20 w-auto" />
                        </Link>
                        <div className="mt-10 flex flex-col items-center">
                            <h3 className="text-xl font-semibold tracking-tight">
                                Reset Your Enconvo Password
                            </h3>
                        </div>
                    </div>

                    <div className="lg:p-8 ">
                        <div
                            className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">

                            <div className="mt-10 grid grid-cols-1 gap-y-8">

                                <Input type="email" placeholder="Email"
                                    required
                                    autoComplete="email"
                                    onChange={(e) => setEmail(e.target.value)} value={email}
                                />

                                {error &&
                                    <Alert variant="destructive">
                                        <AlertDescription className="flex items-center">
                                            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                                            {error}
                                        </AlertDescription>
                                    </Alert>
                                }

                                <Button onClick={signUp} disabled={emailIsLoading}
                                >
                                    {emailIsLoading &&
                                        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}

                                    {emailIsLoading ? "Sending" : "Send Reset Email"}

                                </Button>

                            </div>


                        </div>
                    </div>


                </div>
            </main>
        </>
    )
}
