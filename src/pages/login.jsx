import Head from 'next/head'
import Link from 'next/link'

import {AuthLayout} from '@/components/AuthLayout'
import {Button} from '@/components/Button'
import {TextField} from '@/components/Fields'
import {Logo} from '@/components/Logo'

export default function Login() {
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
                    <div className="mt-10 flex flex-col items-center">
                        <h2 className="text-2xl font-semibold text-gray-900">
                            Log in to Enconvo
                        </h2>
                    </div>
                </div>
                <form action="#" className="mt-20 grid grid-cols-1 gap-y-8">
                    <TextField
                        label="Email address"
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                    />
                    <TextField
                        label="Password"
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                    />
                    <div>
                        <Button
                            type="submit"
                            variant="solid"
                            color="blue"
                            className="w-full"
                        >
              <span>
                Sign in <span aria-hidden="true">&rarr;</span>
              </span>
                        </Button>
                    </div>
                </form>

                <p  className="mt-2 ml-1 text-sm text-gray-700">
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
