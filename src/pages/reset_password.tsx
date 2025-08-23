import {
    createClientComponentClient
} from '@supabase/auth-helpers-nextjs'
// import {useRouter} from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from 'next/router'
import { NativeRouter } from "@/utils/app/native_router";
import RegisterForm from "@/pages/components/RegisterForm";
import RegisterSuccess from "@/pages/components/RegisterSuccess";
import ResetPwdForm from './components/ResetPwdForm';
import { LogIn } from 'lucide-react';
import Login from './login';


export default function ResetPassword() {
    // 获取url参数


    const [registerState, setRegisterState] = useState("register")
    const [session, setSession] = useState({})

    const supabase = createClientComponentClient()



    /**
     * Step 2: Once the user is redirected back to your application,
     * ask the user to reset their password.
     */
    useEffect(() => {

        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("event", event,session)
            if (event == "PASSWORD_RECOVERY") {
                // const { data, error } = await supabase.auth
                //     .updateUser({ password: newPassword })

                // if (data) alert("Password updated successfully!")
                // if (error) alert("There was an error updating your password.")
            }
        })
    }, [])


    useEffect(() => {
        supabase.auth.getSession().then(({ data, error }) => {
            if (data.session) {
                console.log("session", data)
                setSession(data.session)
            }
        })
    }, [])

    return <>
        {registerState === "success" ? <Login /> :
            <ResetPwdForm setLoginState={setRegisterState} />}
    </>
}
