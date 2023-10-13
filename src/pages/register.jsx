import Head from 'next/head'
import Link from 'next/link'

import {AuthLayout} from '@/components/AuthLayout'
import {Button} from '@/components/Button'
import {SelectField, TextField} from '@/components/Fields'
import {Logo} from '@/components/Logo'
import {createClient} from "@supabase/supabase-js";
import {SUPABASE_ANON_KEY, SUPABASE_URL} from "@/utils/app/const";
import {useState} from "react";
import {useRouter} from "next/navigation";

export default function Register() {

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const router = useRouter()

    const handleSignUp = async () => {
        const user = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${location.origin}/login`,
                data: {
                    name: name,
                }
            },
        })
        console.log(user)
    }


    return (
        <>
            <Head>
                <title>Sign Up - EnConvo</title>
            </Head>
            <AuthLayout>
                <div className="flex flex-col items-center">
                    <Link href="/" aria-label="Home">
                        <Logo className="h-20 w-auto"/>
                    </Link>

                    <h2 className="mt-10 text-2xl font-semibold text-gray-900">
                        Get started for free
                    </h2>
                </div>
                <div
                    action="#"
                    className="mt-20 grid grid-cols-1 gap-x-6 gap-y-8 "
                >
                    <TextField
                        label="Name"
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        onChange={(e) => setName(e.target.value)} value={name}

                    />

                    <TextField
                        className="col-span-full"
                        label="Email address"
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        onChange={(e) => setEmail(e.target.value)} value={email}
                        required
                    />
                    <TextField
                        className="col-span-full"
                        label="Password"
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        onChange={(e) => setPassword(e.target.value)} value={password}
                        required
                    />
                    <div className="col-span-full">
                        <Button
                            onClick={handleSignUp}
                            type="submit"
                            variant="solid"
                            color="blue"
                            className="w-full"
                        >
              <span>
                Sign up <span aria-hidden="true">&rarr;</span>
              </span>
                        </Button>
                    </div>
                </div>

                <p className="mt-2 text-sm text-gray-700">
                    Already registered?{' '}
                    <Link
                        href="/login"
                        className="font-medium text-blue-600 hover:underline"
                    >
                        Sign in
                    </Link>{' '}
                    to your account.
                </p>

            </AuthLayout>
        </>
    )
}
