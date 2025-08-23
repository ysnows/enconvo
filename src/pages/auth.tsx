import {
    createClientComponentClient
} from '@supabase/auth-helpers-nextjs'
import LoginForm from './components/LoginForm'
// import {useRouter} from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from 'next/router'
import LoginSuccess from "@/pages/components/LoginSuccess";
import { NativeRouter } from "@/utils/app/native_router";

import { useSearchParams } from 'next/navigation'

export default function Login() {
    // 获取url参数

    const [loginState, setLoginState] = useState("login")
    const handleOpenApp = () => {
        // TODO: Get session from context or prop
        // NativeRouter.login(session.access_token, session.refresh_token)
    }

    // console.log("router", window.location.href)

    useEffect(() => {
        console.log("useEffect")
        setLoginState("successlll" + window.location.href)
        // const params = new URLSearchParams(window.location.search)
        // console.log("params", params.get("name"))
    })

    return <>
        <div>
            {loginState}
            Authorization successful
        </div>
    </>
}
