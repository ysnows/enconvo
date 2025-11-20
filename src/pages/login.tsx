import { useEffect, useState } from "react"
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import LoginForm from './components/LoginForm'
import LoginSuccess from "@/pages/components/LoginSuccess"
import { NativeRouter } from "@/utils/app/native_router"
import type { Session } from '@supabase/supabase-js'

export default function Login() {
    // 获取url参数

    const router = useRouter()

    const [loginState, setLoginState] = useState("login")
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState({})
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const [navigation, setNavigation] = useState([
    ])

    const handleOpenApp = () => {
        if (session) {
            NativeRouter.login(session.access_token, session.refresh_token)
        }
    }
    const handleLogout = () => {
        supabase.auth.signOut().then(() => {
            setLoginState("login")
            setUser(null)
            setNavigation([])
        })
    }


    useEffect(() => {
        supabase.auth.getSession().then(async ({ data, error }) => {
            console.log("data--", data)
            if (data.session) {
                setSession(data.session)
                const expires_at = data.session.expires_at
                console.log("session--", expires_at, new Date().getTime())
                const { data: { user }, error } = await supabase.auth.getUser()
                console.log("user--", user)

                setUser(user)
                // 判断expires_at是否过期
                if (!user) {
                    setNavigation([])
                    setLoginState("login")
                } else {
                    setLoginState("success")
                    setNavigation([
                        { name: "Logout", href: "/" },
                        { name: "Account", href: "/account" },
                    ])

                }
                if (router.query['from'] === "app") {
                    handleOpenApp()
                }
            }
        })
    }, [])

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("event--", event, session)
            if (event === 'SIGNED_IN') {
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
                    if (returnUrl === '/') {
                        console.log('router.query', router.query)
                        // if (router.query === 'app') {
                            setLoginState("success")
                            setNavigation([
                                { name: "Logout", href: "/" },
                                { name: "Account", href: "/account" },
                            ])
                        // } else {
                        //     router.push('account');
                        // }
                    } else {
                        router.push(returnUrl);
                    }
                }
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [router]);

    return <>

        <div >
            <header className="absolute inset-x-0 top-0 z-50">
                <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
                    <div className="ml-32 flex lg:flex-1 items-center ">

                    </div>

                    <div className="mr-32  lg:flex lg:gap-x-12">
                        {loginState === "success" &&
                            <div className="flex items-center space-x-2">
                            <button
                                onClick={() => router.push('/account')}
                                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-md transition-all duration-200"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>Account</span>
                            </button>

                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-md transition-all duration-200"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span>Log Out</span>
                            </button>

                            </div>
                        }
                    </div>
                </nav>

            </header>



            {loginState === "success" ? <LoginSuccess handleOpenApp={handleOpenApp} user={user} /> :
                <LoginForm
                    setLoginState={setLoginState}
                    loginState={loginState}
                    setUser={setUser}
                    router={router}
                >
                </LoginForm>
            }
        </div>
    </>
}
