import {
    createClientComponentClient
} from '@supabase/auth-helpers-nextjs'
import LoginForm from './components/LoginForm'
// import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import {useRouter} from 'next/router'
import LoginSuccess from "@/pages/components/LoginSuccess";
import {NativeRouter} from "@/utils/app/native_router";
import RegisterForm from "@/pages/components/RegisterForm";
import RegisterSuccess from "@/pages/components/RegisterSuccess";


export default function Register() {
    // 获取url参数

    const router = useRouter()

    const [registerState, setRegisterState] = useState("register")
    const [session, setSession] = useState({})
    const [email, setEmail] = useState('')

    const supabase = createClientComponentClient()

    const handleOpenApp = () => {
        NativeRouter.login(session.access_token, session.refresh_token)
    }

    useEffect(() => {
        supabase.auth.getSession().then(({data, error}) => {
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
        {registerState === "success" ? <RegisterSuccess email={email}/> :
            <RegisterForm setLoginState={setRegisterState} loginState={registerState} email={email} setEmail={setEmail}/>}
    </>
}
