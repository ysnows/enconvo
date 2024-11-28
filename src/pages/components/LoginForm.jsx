import Head from 'next/head'
import Link from 'next/link'

import { ReloadIcon, ArrowTopRightIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons"

import { Button } from "@/components/ui/button"


import { Logo } from '@/components/Logo'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import * as React from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { NativeRouter } from "@/utils/app/native_router";

export default function LoginForm({ loginState, setLoginState, setUser }) {

    const supabase = createClientComponentClient()

    const [email, setEmail] = useState('')
    const [continueLogin, setContinueLogin] = useState(false)
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [emailIsLoading, setEmailIsLoading] = React.useState(false)
    const [googleIsLoading, setGoogleIsLoading] = React.useState(false)

    const router = useRouter()



    async function signIn() {
        // check if email is valid
        if (!email || !email.includes('@')) {
            alert('Please enter a valid email')
            return
        }

        setEmailIsLoading(true)
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })

        if (error) {
            setError(error.message)
            setEmailIsLoading(false)
            return
        }
        console.log("session login :", data)

        setUser(data.user)

        await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
        })


        NativeRouter.login(data.session.access_token, data.session.refresh_token)
        setLoginState("success")

        setEmailIsLoading(false)
        // setContinueLogin(true)
    }

    async function signInWithEmail() {

        if (continueLogin) {
            const emailAddress = getEmailProvider(email);
            if (emailAddress) {
                window.location.href = emailAddress;
            } else {

            }
            return
        }
        // check if email is valid
        if (!email || !email.includes('@')) {
            alert('Please enter a valid email')
            return
        }

        setEmailIsLoading(true)
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })

        if (error) {
            setError(error.message)
            setEmailIsLoading(false)
            return
        }
        console.log(data)
        alert('open enconvo app')

        setEmailIsLoading(false)
        // setContinueLogin(true)
    }

    async function signInWithGoogle() {
        try {
            setGoogleIsLoading(true)
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                }
            })
            if (error) throw error
        } catch (error) {
            setError(error.message)
        } finally {
            setGoogleIsLoading(false)
        }
    }

    return (
        <>
            <Head>
                <title>Log In - EnConvo</title>
                <meta
                    name="description"
                    content="you can use it to call AI anytime, anywhere in the MacOS system. You can also integrate AI into your existing workflow through the  plugin system, giving your workflow an AI brain."
                />
            </Head>

            <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <div className="w-full max-w-[320px] space-y-8 px-4">
                    <div className="flex flex-col items-center space-y-6">
                        <Link href="/" aria-label="Home">
                            <Logo className="h-16 w-auto" />
                        </Link>
                        <h2 className="text-center text-2xl font-semibold tracking-tight text-white">
                            Log in to your Enconvo account
                        </h2>
                    </div>

                    {/* Google Login Button */}
                    <div className="mt-8">
                        <Button
                            variant="outline"
                            onClick={signInWithGoogle}
                            disabled={googleIsLoading}
                            className="relative w-full bg-white/10 hover:bg-white/20 text-white font-medium border-gray-700 shadow-sm hover:shadow transition-all duration-200 h-10"
                        >
                            {googleIsLoading ? (
                                <ReloadIcon className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <svg className="absolute left-3 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                </svg>
                            )}
                            Continue with Google
                        </Button>
                    </div>


                    {/* Email Login Form */}
                    <div className="mt-6 space-y-6">
                        <div className="space-y-4">
                            {!continueLogin &&
                                <div className="space-y-1">
                                    <Input 
                                        type="email" 
                                        placeholder="Email address"
                                        required
                                        autoComplete="email"
                                        onChange={(e) => setEmail(e.target.value)} 
                                        value={email}
                                        className="h-10 bg-white/10 border-gray-700 text-white placeholder:text-gray-400"
                                    />
                                </div>
                            }

                            {!continueLogin &&
                                <div className="space-y-1">
                                    <Input
                                        type="password"
                                        placeholder="Password"
                                        required
                                        onChange={(e) => setPassword(e.target.value)}
                                        value={password}
                                        className="h-10 bg-white/10 border-gray-700 text-white placeholder:text-gray-400"
                                    />
                                </div>
                            }

                            {error &&
                                <Alert variant="destructive" className="bg-red-50 text-red-700 border-red-200">
                                    <ExclamationTriangleIcon className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            }

                            <Button 
                                onClick={signIn} 
                                disabled={emailIsLoading}
                                className="w-full bg-blue-600 text-white hover:bg-blue-700 h-10"
                            >
                                {emailIsLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                                {emailIsLoading ? "Logging in..." : (continueLogin ? "Check email for link" : "Continue with email")}
                                {continueLogin && <ArrowTopRightIcon className="ml-2 h-4 w-4" />}
                            </Button>
                        </div>

                        {!continueLogin &&
                            <div className="flex items-center justify-between text-sm">
                                <Link
                                    href="/register"
                                    className="font-medium text-gray-300 hover:text-white"
                                >
                                    Create an account
                                </Link>
                                <Link
                                    href="/reset_password"
                                    className="font-medium text-gray-300 hover:text-white"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        }
                    </div>
                </div>
            </main>
        </>
    )
}
