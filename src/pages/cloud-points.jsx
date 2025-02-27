import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Head from 'next/head'

// Array of available cloud points packages
const pointsPackages = [
  {
    id: '250000_points',
    title: 'Enconvo Cloud Points 250,000',
    price: '$10.00 USD',
    points: '250,000',
    lookupKey: '250000_points'
  },
  {
    id: '1500000_points',
    title: 'Enconvo Cloud Points 1,500,000',
    price: '$50.00 USD',
    points: '1,500,000',
    lookupKey: '1500000_points'
  },
  {
    id: '3000000_points',
    title: 'Enconvo Cloud Points 3,000,000',
    price: '$100.00 USD',
    points: '3,000,000',
    lookupKey: '3000000_points'
  }
]

export default function CloudPoints() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState(null)

  useEffect(() => {
    // Check if user is authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
      setLoading(false)
    })
  }, [router])

  const handlePurchase = async (packageId) => {
    if (!user) return
    
    setPurchaseLoading(true)
    try {
      // Call API to create checkout session
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lookupKey: packageId,
          successUrl: `${window.location.origin}/account?success=cloud_points`,
          cancelUrl: `${window.location.origin}/cloud-points?canceled=true`,
        }),
      })

      const data = await response.json()
      
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to create checkout session. Please try again.')
    } finally {
      setPurchaseLoading(false)
    }
  }
  
  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Enconvo Cloud Points</title>
      </Head>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button 
          onClick={() => router.back()} 
          className="flex items-center text-gray-400 hover:text-white mb-8"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Account
        </button>
        
        <h1 className="text-3xl font-bold mb-4">Enconvo Cloud Points</h1>
        
        <div className="mb-8">
          <p className="text-gray-300">
            Enconvo Cloud points can be used for services like LLM, TTS, Speech-to-Text, Image generation, and more.
          </p>
          <p className="text-gray-300 mt-2">
            <span className="text-blue-400">*</span> Points never expire until they're used.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pointsPackages.map((pkg) => (
            <div 
              key={pkg.id}
              className={`border rounded-lg p-6 transition-all ${
                selectedPackage === pkg.id 
                  ? 'border-blue-500 bg-gray-800' 
                  : 'border-gray-700 bg-gray-800 hover:border-gray-500'
              }`}
              onClick={() => setSelectedPackage(pkg.id)}
            >
              <div className="mb-4">
                <Image
                  src="https://file.enconvo.com/circle_logo.png"
                  alt="Enconvo Logo"
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              </div>
              
              <h3 className="text-xl font-semibold mb-2">{pkg.points} Points</h3>
              <p className="text-gray-300 mb-4">{pkg.price}</p>
              
              <button
                onClick={() => handlePurchase(pkg.lookupKey)}
                disabled={purchaseLoading}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium transition-colors disabled:opacity-50"
              >
                {purchaseLoading && selectedPackage === pkg.id ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Purchase'
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 