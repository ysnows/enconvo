import {
    createClientComponentClient
} from '@supabase/auth-helpers-nextjs'
import LoginForm from './components/LoginForm'
import { useEffect, useState } from "react";
import { useRouter } from 'next/router'
import LoginSuccess from "@/pages/components/LoginSuccess";
import { NativeRouter } from "@/utils/app/native_router";
import { Dialog } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from "@/components/ui/button"
import PaySuccess from './components/PaySucess';

export default function Login() {
    // 获取url参数

    const router = useRouter()

    const [loginState, setLoginState] = useState("login")
    const [session, setSession] = useState({})
    const [user, setUser] = useState({})
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const [navigation, setNavigation] = useState([
    ])

    const supabase = createClientComponentClient()

    const handleOpenApp = () => {
        // NativeRouter.login(session.access_token, session.refresh_token)
        // navigate to login success page
        router.push("/login")
    }
    const handleLogout = () => {
        supabase.auth.signOut().then(() => {
            setLoginState("login")
            setUser(null)
            setNavigation([])
        })
    }


    useEffect(() => {
    }, [])

    return <>

        <div >
            <header className="absolute inset-x-0 top-0 z-50">
                <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
                    <div className="ml-32 flex lg:flex-1 items-center ">

                    </div>

                    <div className="mr-32 hidden lg:flex lg:gap-x-12">
                        {loginState === "success" &&
                            <Button variant="outline" onClick={handleLogout} className="mt-10 border-2">
                                Logout
                            </Button>
                        }

                    </div>
                </nav>

            </header>

            <PaySuccess handleOpenApp={handleOpenApp} />

        </div>
    </>
}
