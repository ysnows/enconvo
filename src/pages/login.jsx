import {createServerComponentClient} from '@supabase/auth-helpers-nextjs'
import {cookies} from 'next/headers'
import LoginForm from './components/LoginForm'


export default function Login() {

    return <LoginForm/>
}
