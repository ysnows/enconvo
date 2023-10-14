import {
    createClientComponentClient
} from '@supabase/auth-helpers-nextjs'
import LoginForm from './components/LoginForm'
// import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import {useRouter} from 'next/router'
import LoginSuccess from "@/pages/components/LoginSuccess";
import {NativeRouter} from "@/utils/app/native_router";


export default function Login() {
    // 获取url参数

    const router = useRouter()

    const [loginState, setLoginState] = useState("login")
    const [session, setSession] = useState({})

    const supabase = createClientComponentClient()

    const handleOpenApp = () => {
        NativeRouter.login(session.access_token, session.refresh_token)
    }

    useEffect(() => {
        supabase.auth.getSession().then(({data, error}) => {
            if (data.session) {
                console.log("session", data)
                setSession(data.session)
                setLoginState("success")
                if (router.query['from'] === "app") {
                    handleOpenApp()
                }
            }
        })
    }, [])

    return <>
        {loginState === "success" ? <LoginSuccess handleOpenApp={handleOpenApp}/> :
            <LoginForm setLoginState={setLoginState} loginState={loginState}/>}
    </>
}
