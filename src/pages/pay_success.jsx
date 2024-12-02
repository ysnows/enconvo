import { useEffect, useState } from "react"
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import PaySuccess from './components/PaySucess'

export default function Login() {
    // 获取url参数

    const router = useRouter()

    const [loginState, setLoginState] = useState("login")
    const [session, setSession] = useState({})
    const [user, setUser] = useState({})
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const [navigation, setNavigation] = useState([
    ])

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
        // Check to see if this is a redirect back from Checkout
        const query = new URLSearchParams(window.location.search);
        if (query.get('success')) {
            console.log('Order placed! You will receive an email confirmation.');
        }

        if (query.get('canceled')) {
            console.log('Order canceled -- continue to shop around and checkout when you’re ready.');
        }
    }, []);

    return <>

        <div >
            <header className="absolute inset-x-0 top-0 z-50">
                <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
                    <div className="ml-32 flex lg:flex-1 items-center ">

                    </div>

                    <div className="mr-32 hidden lg:flex lg:gap-x-12">
                        {loginState === "success" &&
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-md transition-all duration-200"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span>Log Out</span>
                            </button>
                        }
                    </div>
                </nav>

            </header>

            <PaySuccess handleOpenApp={handleOpenApp} />

        </div>
    </>
}
