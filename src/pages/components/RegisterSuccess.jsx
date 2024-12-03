import Head from 'next/head'
import { Button } from "@/components/ui/button"
import { Logo } from '@/components/Logo'
import { getEmailLink } from "@/utils/app/email_link";
import * as React from "react";

export default function RegisterSuccess({ email }) {
    const openEmail = () => {
        window.open(getEmailLink(email))
    }

    return (
        <>
            <Head>
                <title>Sign Up Success - EnConvo</title>
                <meta
                    name="description"
                    content="you can use it to call AI anytime, anywhere in the MacOS system. You can also integrate AI into your existing workflow through the plugin system, giving your workflow an AI brain."
                />
            </Head>

            <main className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A1A]">
                <div className="w-full max-w-[480px] space-y-8 px-4">
                    <div className="flex flex-col items-center space-y-8">
                        <Logo className="h-16 w-auto" />
                        <div className="text-center space-y-4">
                            <h3 className="text-3xl font-medium tracking-tight text-white">
                                Email has been sent
                            </h3>
                            <p className="text-base text-[#888888]">
                                We&apos;ve sent a confirmation email to <span className="text-white">{email}</span>.
                                Please check your inbox and confirm your email address to start using Enconvo.
                            </p>
                        </div>

                        <Button
                            onClick={openEmail}
                            className="w-full max-w-[200px] bg-[#E5E5E5] hover:bg-[#D4D4D4] text-[#1A1A1A] font-medium h-10 rounded-xl transition-all duration-200"
                        >
                            Check Email
                        </Button>
                    </div>
                </div>
            </main>
        </>
    )
}
