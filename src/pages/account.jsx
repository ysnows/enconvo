import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { NativeRouter } from "@/utils/app/native_router"
export default function Account() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [session, setSession] = useState({})
    const [loading, setLoading] = useState(true)
    const [userInfo, setUserInfo] = useState(null)
    const [managingSubscription, setManagingSubscription] = useState(false)

    const fetchUserInfo = async (token) => {
        try {
            const response = await fetch('/api/user-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            })
            const data = await response.json()
            if (data.code === 200) {
                setUserInfo(data.data)
            }
        } catch (error) {
            console.error('Error fetching user info:', error)
        }
    }

    const handleManageSubscription = async (action) => {
        if (!user) return

        setManagingSubscription(true)
        try {
            const response = await fetch('/api/subscription/manage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.access_token}`,
                },
                body: JSON.stringify({ action }),
            })

            const data = await response.json()
            if (data.code === 200) {
                // Refresh user info after successful action
                await fetchUserInfo(user.access_token)
            }
        } catch (error) {
            console.error('Error managing subscription:', error)
        } finally {
            setManagingSubscription(false)
        }
    }

    const getSubscriptionInfo = (type, subscriptionType) => {
        if (type === 'lifetime') {
            return {
                label: type === 'standard' ? 'Lifetime Standard' : 'Lifetime Premium',
                canRefund: true, // You'll need to check the actual purchase date
                action: 'Request Refund',
            }
        } else {
            return {
                label: `${subscriptionType} Subscription`,
                canCancel: true,
                action: 'Cancel Subscription',
            }
        }
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            if (!session) {
                router.push('/login')
                return
            }
            console.log(session.user)
            setUser(session.user)
            fetchUserInfo(session.access_token)
            setLoading(false)
        })
    }, [router])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const handleOpenApp = () => {
        NativeRouter.login(session.access_token, session.refresh_token)
    }

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex justify-end">
                    <button
                        onClick={handleOpenApp}
                        className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-md transition-all duration-200"
                    >
                        {/* Icon for opening app - external link symbol */}
                        {/* <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg> */}
                        <span>Open Enconvo</span>
                    </button>
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-md transition-all duration-200"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Log Out</span>
                    </button>
                </div>

                <div className="mt-8">
                    <h1 className="text-2xl font-bold mb-8">Account</h1>

                    <div className="space-y-8">
                        <div className="flex items-center space-x-4">
                            <div className="relative w-16 h-16">
                                <Image
                                    src={user?.user_metadata?.avatar_url || 'https://file.enconvo.com/circle_logo.png'}
                                    alt="Profile"
                                    fill
                                    className="rounded-full object-cover bg-gray-800"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://file.enconvo.com/circle_logo.png';
                                    }}
                                />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">{user?.user_metadata?.name || 'User'}</h2>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold mb-4">Account Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-400">Email</label>
                                        <div className="mt-1 p-3 bg-gray-800 rounded-md">
                                            {user?.email}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!userInfo && (
                                // Display loading state while fetching user information
                                <div className="animate-pulse space-y-4">
                                    <div className="h-6 w-32 bg-gray-800 rounded"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-24 bg-gray-800 rounded"></div>
                                        <div className="h-10 bg-gray-800 rounded"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-24 bg-gray-800 rounded"></div>
                                        <div className="h-10 bg-gray-800 rounded"></div>
                                    </div>
                                </div>
                            )}

                            {userInfo && (
                                <div className="space-y-4">
                                    <div>
                                        {/* Subscription title with manage button aligned to the right */}
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xl font-semibold">Subscription</h3>
                                            {(userInfo.subscription.type === "monthly" || userInfo.subscription.type === "yearly") && (
                                                <button
                                                    onClick={async () => {
                                                        // Add loading state
                                                        const btn = event.target;
                                                        const originalText = btn.innerText;
                                                        btn.innerHTML = `${originalText} <svg class="inline-block ml-1 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>`;

                                                        // Call billing portal API endpoint
                                                        const response = await fetch('/api/subscription/billing_portal', {
                                                            method: 'POST',
                                                        });
                                                        const data = await response.json();

                                                        // Redirect to Stripe billing portal
                                                        if (data.url) {
                                                            window.location.href = data.url;
                                                        }

                                                        // Reset button text if redirect fails
                                                        btn.innerText = originalText;
                                                    }}
                                                    className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 rounded-md text-white transition-colors"
                                                >
                                                    Manage Subscription
                                                </button>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm text-gray-400">Plan Type</label>
                                                <div className="mt-1 p-3 bg-gray-800 rounded-md capitalize">
                                                    {userInfo.subscription.type === 'lifetime' ? (
                                                        <>Lifetime {userInfo.subscription.subscription}</>
                                                    ) : (
                                                        <>{userInfo.subscription.type} Subscription</>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-400">Points Usage</label>
                                                <div className="mt-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm text-gray-400">
                                                            {userInfo.subscription.points} / {userInfo.subscription.maxPoints}
                                                        </span>
                                                        <span className="text-sm text-gray-400">
                                                            {Math.round((userInfo.subscription.points / userInfo.subscription.maxPoints) * 100)}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                            style={{
                                                                width: `${(userInfo.subscription.points / userInfo.subscription.maxPoints) * 100}%`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Previous subscription management code commented out */}
                                            {/* {userInfo.subscription.type === 'lifetime' ? (
                                                <div className="mt-4">
                                                    <button
                                                        onClick={() => handleManageSubscription('refund')}
                                                        disabled={managingSubscription}
                                                        className="text-red-400 hover:text-red-300 text-sm underline disabled:opacity-50"
                                                    >
                                                        Request Refund (Available within 14 days of purchase)
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="mt-4">
                                                    <button
                                                        onClick={() => handleManageSubscription('cancel')}
                                                        disabled={managingSubscription}
                                                        className="text-red-400 hover:text-red-300 text-sm underline disabled:opacity-50"
                                                    >
                                                        Cancel Subscription
                                                    </button>
                                                </div>
                                            )} */}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
