import { I18nText } from '@/i18n/I18nText'
import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Head from 'next/head'

// Array of available cloud points packages.
// lookupKey is the legacy Stripe key; the displayed point amount is the current grant.
const pointsPackages = [
  {
    id: '250000_points',
    title: 'Enconvo Cloud Points 450,000',
    price: '$10.00 USD',
    points: '450,000',
    lookupKey: '250000_points',
  },
  {
    id: '1500000_points',
    title: 'Enconvo Cloud Points 2,250,000',
    price: '$50.00 USD',
    points: '2,250,000',
    lookupKey: '1500000_points',
  },
  {
    id: '3000000_points',
    title: 'Enconvo Cloud Points 4,500,000',
    price: '$100.00 USD',
    points: '4,500,000',
    lookupKey: '3000000_points',
  },
]

export default function CloudPoints() {
  const { t, locale } = useI18n()

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
    const {
      data: { session },
    } = await supabase.auth.getSession()

    setPurchaseLoading(true)
    try {
      // Call API to create checkout session
      const response = await fetch('/api/subscription/checkout_sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lookupKey: packageId,
          locale,
          email: session.user.email,
        }),
      })

      console.log('response.status', response.status)

      if (response.status === 200) {
        const data = await response.json()
        if (data.url) {
          window.location.href = data.url
        }
      } else {
        const error = await response.json()
        console.error('Payment error:', error)
        alert('Failed to create checkout session. Please try again.')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to create checkout session. Please try again.')
    } finally {
      setPurchaseLoading(false)
    }
  }

  if (loading) {
    return <div>{t('Loading...')}</div>
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>{t('Enconvo Cloud Points')}</title>
      </Head>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center text-gray-400 hover:text-white"
        >
          <svg
            className="mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          {t('Back to Account')}
        </button>

        <h1 className="mb-4 text-3xl font-bold">{t('Enconvo Cloud Points')}</h1>

        <div className="mb-8">
          <p className="mb-4 text-gray-300">
            {t(
              'Enconvo Cloud points can be used for services like LLM, TTS, Speech-to-Text, Image generation, and more.'
            )}
          </p>
          <p className="mt-2 text-gray-300">
            <I18nText
              source={"{p0} Points never expire until they're used."}
              values={{ p0: <span className="text-blue-400">*</span> }}
            />
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {pointsPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-lg border p-6 transition-all ${
                selectedPackage === pkg.id
                  ? 'border-blue-500 bg-gray-800'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-500'
              }`}
              onClick={() => setSelectedPackage(pkg.id)}
            >
              <div className="mb-4">
                <Image
                  src="https://file.enconvo.com/circle_logo.png"
                  alt={t('Enconvo Logo')}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              </div>

              <h3 className="mb-2 text-xl font-semibold">
                {pkg.points} {t(' Points')}
              </h3>
              <p className="mb-4 text-gray-300">{pkg.price}</p>

              <button
                onClick={() => handlePurchase(pkg.lookupKey)}
                disabled={purchaseLoading}
                className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {purchaseLoading && selectedPackage === pkg.id ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {t('Processing...')}
                  </span>
                ) : (
                  t('Purchase')
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export const getStaticProps = i18nStaticProps('/cloud-points')
