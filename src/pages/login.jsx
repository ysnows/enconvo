import {
    createClientComponentClient
} from '@supabase/auth-helpers-nextjs'
import LoginForm from './components/LoginForm'
// import {useRouter} from "next/navigation";
import {useState} from "react";
import {useRouter} from 'next/router'
import LoginSuccess from "@/pages/components/LoginSuccess";
import {NativeRouter} from "@/utils/app/native_router";


export default function Login() {
    // 获取url参数

    const router = useRouter()

    const [loginState, setLoginState] = useState("login")

    const supabase = createClientComponentClient()

    supabase.auth.getSession().then(({data, error}) => {
        if (data.session) {
            console.log("session", data)
            setLoginState("success")
            if (router.query['from'] === "app") {
                NativeRouter.login(data.session.access_token, data.session.refresh_token)
            }
        }
    })


    return <>
        {loginState === "success" ? <LoginSuccess/> :
            <LoginForm setLoginState={setLoginState} loginState={loginState}/>}
    </>
}
