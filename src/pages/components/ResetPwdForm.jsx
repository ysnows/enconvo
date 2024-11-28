import Head from 'next/head'
import Link from 'next/link'

import { ReloadIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons"

import { Button } from "@/components/ui/button"


import { Logo } from '@/components/Logo'
import { useState } from "react";
import { Input } from "@/components/ui/input";
import * as React from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ResetPwdForm({ setLoginState }) {

    const supabase = createClientComponentClient()


    // const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [emailIsLoading, setEmailIsLoading] = React.useState(false)



    async function signUp() {
        // check if email is valid
        if (!password) {
            alert('Please enter a valid email')
            return
        }

        setEmailIsLoading(true)


        const { data, error } = await supabase.auth
            .updateUser({ password: password })



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

            <main className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A1A]">
                <div className="w-full max-w-[320px] space-y-8 px-4">
                    <div className="flex flex-col items-center space-y-6">
                        <Link href="/" aria-label="Home">
                            <Logo className="h-16 w-auto" />
                        </Link>
                        <h3 className="text-center text-3xl font-medium tracking-tight text-white">
                        Set Your New Enconvo Password
                        </h3>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <Input
                                type="password"
                                placeholder="Password"
                                required
                                autoComplete="current-password"
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                className="h-10 bg-[#1C1C1C] border-[#333333] text-white placeholder:text-[#666666]"
                            />

                            {error &&
                                <Alert variant="destructive" className="bg-red-900/20 text-red-400 border-red-900/30">
                                    <AlertDescription className="flex items-center">
                                        <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            }

                            <Button 
                                onClick={signUp} 
                                disabled={emailIsLoading}
                                className="w-full bg-[#E5E5E5] hover:bg-[#D4D4D4] text-[#1A1A1A] font-medium h-10 rounded-xl transition-all duration-200"
                            >
                                {emailIsLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                                {emailIsLoading ? "Resetting" : "Reset Password"}
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
