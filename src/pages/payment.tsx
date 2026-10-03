import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import React from 'react'
import { loadStripe } from '@stripe/stripe-js'

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

export default function PreviewPage() {
  const { t, locale } = useI18n()

  React.useEffect(() => {
    // Check to see if this is a redirect back from Checkout
    const query = new URLSearchParams(window.location.search)
    if (query.get('success')) {
      console.log('Order placed! You will receive an email confirmation.')
    }

    if (query.get('canceled')) {
      console.log(
        'Order canceled -- continue to shop around and checkout when you’re ready.'
      )
    }
  }, [])

  return (
    <form action="/api/checkout_sessions" method="POST">
      <section>
        <button type="submit" role="link">
          {t('Checkout')}
        </button>
      </section>
      <style jsx>
        {
          '\n          section {\n            background: #ffffff;\n            display: flex;\n            flex-direction: column;\n            width: 400px;\n            height: 112px;\n            border-radius: 6px;\n            justify-content: space-between;\n          }\n          button {\n            height: 36px;\n            background: #556cd6;\n            border-radius: 4px;\n            color: white;\n            border: 0;\n            font-weight: 600;\n            cursor: pointer;\n            transition: all 0.2s ease;\n            box-shadow: 0px 4px 5.5px 0px rgba(0, 0, 0, 0.07);\n          }\n          button:hover {\n            opacity: 0.8;\n          }\n        '
        }
      </style>
    </form>
  )
}
export const getStaticProps = i18nStaticProps('/payment')
