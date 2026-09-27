import {
    createClientComponentClient
} from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from "react"
import { useRouter } from 'next/router'
import { NativeRouter } from "@/utils/app/native_router"
import RegisterForm from "@/pages/components/RegisterForm"
import RegisterSuccess from "@/pages/components/RegisterSuccess"
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'


export default function Register() {
    // 获取url参数

    const router = useRouter()

    const [registerState, setRegisterState] = useState("register")
    const [session, setSession] = useState<Session | null>(null)
    const [email, setEmail] = useState('')

    const supabase = createClientComponentClient()

    const handleOpenApp = () => {
        if (session) {
            NativeRouter.login(session.access_token, session.refresh_token)
        }
    }

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_UP' as AuthChangeEvent || event === 'SIGNED_IN' as AuthChangeEvent) {
                const returnUrl = Array.isArray(router.query.returnUrl) ? router.query.returnUrl[0] : (router.query.returnUrl || '/');
                if (typeof returnUrl === 'string' && returnUrl.startsWith('/pricing?plan=')) {
                    // 如果是从定价页面跳转来的，解析出 plan 参数并触发支付
                    console.log("window.endorsely_referral", window.endorsely_referral)
                    const plan = returnUrl.split('plan=')[1];
                    const response = await fetch('/api/subscription/checkout_sessions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            lookupKey: plan,
                            endorsely_referral: window.endorsely_referral
                        }),
                    });

                    if (response.status === 200) {
                        const data = await response.json();
                        window.location.href = data.url;
                    }
                } else {
                    router.push(returnUrl);
                }
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [router]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data, error }) => {
            if (data.session) {
                console.log("session", data)
                setSession(data.session)
                setRegisterState("success")
                if (router.query['from'] === "app") {
                    handleOpenApp()
                }
            }
        })
    }, [])

    return <>
        {registerState === "success" ? <RegisterSuccess email={email} /> :
            <RegisterForm setLoginState={setRegisterState} loginState={registerState} email={email} setEmail={setEmail} />}

    </>
}
