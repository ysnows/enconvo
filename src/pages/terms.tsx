import { I18nText } from '@/i18n/I18nText'
import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { canonicalUrl } from '@/i18n/locale'
import Head from 'next/head'
import {
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/20/solid'
import Link from 'next/link'

export default function Privacy() {
  const { t, locale } = useI18n()

  return (
    <div className="bg-white px-6 py-32 lg:px-8">
      <Head>
        <title>{t('Enconvo Terms of Use')}</title>
        <meta
          name="description"
          content={t('Terms of use for the Enconvo macOS application.')}
        />
        <link
          rel="canonical"
          href={canonicalUrl('/terms', locale)}
          key="canonical"
        />
      </Head>
      <div className="mx-auto max-w-3xl text-base leading-7 text-gray-700">
        <p className="mb-8 text-base font-semibold leading-7 text-indigo-600">
          _______________________
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {t('Terms of Use')}
        </h1>
        <p className="mt-6 text-xl leading-8">
          {t(
            'Thank you for using Enconvo. Your support motivates us to improve this product.'
          )}
        </p>
        <div className="mt-10 max-w-2xl">
          <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">
            {t('Pricing strategy')}
          </h2>
          <p className="mt-6">
            {t(
              'Enconvo Basic version is free to use, but with limited functionality.'
            )}
          </p>
          <p className="mt-6">
            {t(
              'Enconvo Pro version requires payment, and after purchasing the Pro version, you can use all functions without any limitations. The payment plan is a lifetime buyout, and you only need to pay once to use it permanently.'
            )}
          </p>
          <p className="mt-6">
            <I18nText
              source={
                'We offer a {p0} for you to experience the Pro version, and you can decide whether to purchase it after the trial.'
              }
              values={{
                p0: <span className="font-bold">{t('14-day free trial')}</span>,
              }}
            />
          </p>
        </div>
        <div className="mt-16 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {t('Refund')}
          </h2>
          <p className="mt-6">
            {t(
              'If you have such thoughts, we are sorry, so please prioritize contacting us to resolve your dissatisfaction, but we always respect your choice. '
            )}
          </p>
          <p className="mt-8">
            <I18nText
              source={
                'Standard, Premium and Teams licenses come with a {p0} from the date of purchase. You can request a refund in Enconvo under Settings → Account, or by emailing {p1}. Enconvo Cloud subscriptions can be canceled at any time.'
              }
              values={{
                p0: (
                  <span className="font-bold">
                    {t('30-day money-back guarantee')}
                  </span>
                ),
                p1: (
                  <a
                    className={'text-indigo-600'}
                    href="mailto:support@enconvo.com"
                  >
                    {t('support@enconvo.com')}
                  </a>
                ),
              }}
            />
          </p>
        </div>
        <div className="mt-16 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {t('Changes to this Privacy Policy')}
          </h2>
          <p className="mt-6">
            {t(
              'We may update our privacy policy from time to time to adapt to the latest situation of Enconvo. Therefore, we recommend that you regularly check this page for the latest content.'
            )}
            <br />
            {t(
              'We will notify you of any changes by posting a new privacy policy on this page. All changes take effect immediately after being posted on this page.'
            )}
          </p>
        </div>
        <div className="mt-16 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {t('Contact Us')}
          </h2>
          <p className="mt-6">
            {t(
              'If you have any questions or suggestions about our terms of use , please contact us at:   '
            )}
            <Link
              className="text-indigo-600"
              href={'mailto:support@enconvo.com'}
            >
              {t('support@enconvo.com')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export const getStaticProps = i18nStaticProps('/terms')
