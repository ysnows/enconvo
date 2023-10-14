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

export default function LoginForm({loginState, setLoginState}) {

    const supabase = createClientComponentClient()

    const [email, setEmail] = useState('')
    const [continueLogin, setContinueLogin] = useState(false)
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [emailIsLoading, setEmailIsLoading] = React.useState(false)
    const [googleIsLoading, setGoogleIsLoading] = React.useState(false)

    const router = useRouter()


    function getEmailProvider(email) {
        const domain = email.split('@')[1];

        switch (domain) {
            case 'gmail.com':
                return 'https://mail.google.com';
            case 'yahoo.com':
                return 'https://mail.yahoo.com';
            case 'outlook.com':
                return 'https://outlook.live.com';
            case 'hotmail.com':
                return 'https://outlook.live.com';
            case 'aol.com':
                return 'https://mail.aol.com';
            case 'zoho.com':
                return 'https://www.zoho.com/mail/';
            case 'mail.com':
                return 'https://www.mail.com/int/';
            case 'yandex.com':
                return 'https://mail.yandex.com/';
            case '163.com':
                return 'https://mail.163.com/';
            // 添加更多的邮件提供商...
            default:
                return ``;
        }

    }

    async function signIn() {
        // check if email is valid
        if (!email || !email.includes('@')) {
            alert('Please enter a valid email')
            return
        }

        setEmailIsLoading(true)
        const {data, error} = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })

        if (error) {
            setError(error.message)
            setEmailIsLoading(false)
            return
        }
        console.log(data)

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
        const {data, error} = await supabase.auth.signInWithPassword({
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

    return (
        <>
            <Head>
                <title>Sign In - EnConvo</title>
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

                    <div className="lg:p-8 ">
                        <div
                            className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">

                            <div className="mt-10 grid grid-cols-1 gap-y-8">
                                {
                                    !continueLogin &&

                                    <Input type="email" placeholder="Email"
                                           required
                                           autoComplete="email"
                                           onChange={(e) => setEmail(e.target.value)} value={email}
                                    />
                                }

                                <Input
                                    label="Password"
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    onChange={(e) => setPassword(e.target.value)} value={password}
                                    required
                                />

                                {error &&
                                    <Alert variant="destructive">
                                        <AlertDescription className="flex items-center">
                                            <ExclamationTriangleIcon className="h-4 w-4 mr-2"/>
                                            {error}
                                        </AlertDescription>
                                    </Alert>
                                }

                                <Button onClick={signIn} disabled={emailIsLoading}
                                >
                                    {emailIsLoading &&
                                        <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}

                                    {emailIsLoading ? "Signing in" : (continueLogin ? "Check Link in your Email" : "Sign In")}

                                    {continueLogin &&
                                        <ArrowTopRightIcon className="mr-2 h-4 w-4 ml-2"/>}
                                </Button>

                            </div>

                            {
                                !continueLogin &&

                                <>

                                    {/*                          <div className="relative">*/}
                                    {/*                              <div className="absolute inset-0 flex items-center">*/}
                                    {/*                                  <span className="w-full border-t"/>*/}
                                    {/*                              </div>*/}
                                    {/*                              <div*/}
                                    {/*                                  className="relative flex justify-center text-xs uppercase">*/}
                                    {/*<span className="bg-background px-2 text-muted-foreground">*/}
                                    {/*  Or*/}
                                    {/*</span>*/}
                                    {/*                              </div>*/}
                                    {/*                          </div>*/}
                                    {/*                          <Button variant="outline" type="button"*/}
                                    {/*                                  disabled={googleIsLoading}>*/}
                                    {/*                              {googleIsLoading ? (*/}
                                    {/*                                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>*/}
                                    {/*                              ) : (*/}
                                    {/*                                  <Icons.google className="mr-2 h-4 w-4"/>*/}
                                    {/*                              )}{" "}*/}
                                    {/*                              Sign in with Google*/}
                                    {/*                          </Button>*/}

                                    <p className="mt-2 ml-1 text-sm text-gray-700">
                                        Don’t have an account?{' '}
                                        <Link
                                            href="/register"
                                            className="font-medium text-blue-600 hover:underline"
                                        >
                                            Sign up
                                        </Link>{' '}
                                        for a free trial.
                                    </p>

                                    <p className="px-8 text-center text-sm text-muted-foreground">
                                        By clicking continue, you agree to our{" "}
                                        <Link
                                            href="/terms"
                                            className="underline underline-offset-4 hover:text-primary"
                                        >
                                            Terms of Service
                                        </Link>{" "}
                                        and{" "}
                                        <Link
                                            href="/privacy"
                                            className="underline underline-offset-4 hover:text-primary"
                                        >
                                            Privacy Policy
                                        </Link>
                                        .
                                    </p>
                                </>
                            }
                        </div>
                    </div>


                </div>
            </main>
        </>
    )
}
