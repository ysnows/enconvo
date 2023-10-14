import {
    createClientComponentClient
} from '@supabase/auth-helpers-nextjs'
import LoginForm from './components/LoginForm'
import {useRouter} from "next/navigation";

export default function Login() {

    const router = useRouter()
    const supabase = createClientComponentClient()

    supabase.auth.getSession().then((session) => {
        if (session) {
            console.log(session)
            router.push('/')
        }
    })

    return <LoginForm/>
}
