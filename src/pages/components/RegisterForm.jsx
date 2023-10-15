import Head from 'next/head'
import Link from 'next/link'

import {ReloadIcon, ArrowTopRightIcon, ExclamationTriangleIcon} from "@radix-ui/react-icons"

import {Button} from "@/components/ui/button"


import {Logo} from '@/components/Logo'
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Input} from "@/components/ui/input";
import * as React from "react";
import {createClientComponentClient} from "@supabase/auth-helpers-nextjs";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";

export default function RegisterForm({loginState, setLoginState, email, setEmail}) {

    const supabase = createClientComponentClient()


    // const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [error, setError] = useState('')
    const [emailIsLoading, setEmailIsLoading] = React.useState(false)
    const [googleIsLoading, setGoogleIsLoading] = React.useState(false)

    const router = useRouter()


    async function signUp() {
        // check if email is valid
        if (!email || !email.includes('@')) {
            alert('Please enter a valid email')
            return
        }

        setEmailIsLoading(true)
        const {data, error} = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: 'http://localhost:3000/login',
                data: {
                    name: name,
                }
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
                <title>Sign Up - EnConvo</title>
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
                                Create your Enconvo account
                            </h3>
                        </div>
                    </div>

                    <div className="lg:p-8 ">
                        <div
                            className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">

                            <div className="mt-10 grid grid-cols-1 gap-y-8">

                                <Input
                                    label="Name"
                                    id="name"
                                    name="name"
                                    type="name"
                                    autoComplete="name"
                                    onChange={(e) => setName(e.target.value)} value={name}
                                    required
                                />

                                <Input type="email" placeholder="Email"
                                       required
                                       autoComplete="email"
                                       onChange={(e) => setEmail(e.target.value)} value={email}
                                />

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

                                <Button onClick={signUp} disabled={emailIsLoading}
                                >
                                    {emailIsLoading &&
                                        <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}

                                    {emailIsLoading ? "Signing Up" : "Sign Up"}

                                </Button>

                            </div>


                            <p className="mt-2 ml-1 text-sm text-gray-700">
                                Already have an account? go to{' '}
                                <Link
                                    href="/login"
                                    className="font-medium text-blue-600 hover:underline"
                                >
                                    Sign in
                                </Link>{' '}
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
                        </div>
                    </div>


                </div>
            </main>
        </>
    )
}
