import Head from 'next/head'
import Link from 'next/link'

import {AuthLayout} from '@/components/AuthLayout'
import {Button} from '@/components/Button'
import {TextField} from '@/components/Fields'
import {Logo} from '@/components/Logo'
import {SUPABASE_ANON_KEY, SUPABASE_URL} from "@/utils/app/const";
import {useState} from "react";
import {createClient} from "@supabase/supabase-js";
import {useRouter} from "next/navigation";
import {ThemeSupa} from "@supabase/auth-ui-shared";
import {Auth} from "@supabase/auth-ui-react";

export default function Login() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const router = useRouter()

    async function signInWithEmail() {

        const {data, error} = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        })
        if (data) {
            router.push('/')
        }
    }

    return (
        <>
            <Head>
                <title>Sign In - EnConvo</title>
            </Head>


            <AuthLayout>
                <div className="flex flex-col items-center">
                    <Link href="/" aria-label="Home">
                        <Logo className="h-20 w-auto"/>
                    </Link>
                    <div className="mt-10 mb-10 flex flex-col items-center">
                        <h2 className="text-2xl font-semibold text-gray-900">
                            Log in to Enconvo
                        </h2>
                    </div>
                </div>

                {/*<Auth*/}
                {/*    supabaseClient={supabase}*/}
                {/*    providers={[]}*/}
                {/*    socialLayout={'horizontal'}*/}
                {/*    // view={'magic_link'}*/}
                {/*    redirectTo={'/login'}*/}
                {/*    appearance={{*/}
                {/*        theme: ThemeSupa, variables: {*/}
                {/*            default: {},*/}
                {/*        },*/}
                {/*    }}*/}
                {/*/>*/}


                <div className="mt-20 grid grid-cols-1 gap-y-8">
                    <TextField
                        label="Email address"
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        onChange={(e) => setEmail(e.target.value)} value={email}
                    />

                    <TextField
                        label="Password"
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        onChange={(e) => setPassword(e.target.value)} value={password}
                        required
                    />

                    <div>
                        <Button
                            type="submit"
                            variant="solid"
                            color="blue"
                            className="w-full"
                            onClick={signInWithEmail}
                        >
                        <span>
                          Sign in <span aria-hidden="true">&rarr;</span>
                        </span>
                        </Button>


                    </div>
                </div>

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

            </AuthLayout>
        </>
    )
}
