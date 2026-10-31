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
import { COMPANY_NAME, COPYRIGHT_NOTICE_EMAIL, DMCA_AGENT } from '@/data/legal'
import { MINIMUM_AGE } from '@/lib/age-gate'

// An ISO date parses as UTC midnight, so the UTC format below shows this day in every time zone.
const LAST_UPDATED = '2026-10-31'

export default function Terms() {
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
        <p className="mt-4 text-sm text-gray-500">
          <I18nText
            source={'Last updated: {p0}'}
            values={{
              p0: new Intl.DateTimeFormat(locale, {
                dateStyle: 'long',
                timeZone: 'UTC',
              }).format(new Date(LAST_UPDATED)),
            }}
          />
        </p>
        <p className="mt-6 text-xl leading-8">
          {t(
            'Thank you for using Enconvo. Your support motivates us to improve this product.'
          )}
        </p>
        <p className="mt-6">
          {t(
            'Enconvo is provided by {p0}. By creating an account or using Enconvo, you agree to these terms.',
            { p0: COMPANY_NAME }
          )}
        </p>
        <div id="eligibility" className="mt-16 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {t('Who can use Enconvo')}
          </h2>
          <p className="mt-6">
            {t(
              'You must be at least {p0} years old to create an Enconvo account or use Enconvo. If the law where you live sets a higher age for agreeing to these terms or to the processing of your personal data, you must be at least that age. If you are under 18, you may use Enconvo only with the permission of a parent or legal guardian, who accepts these terms for you and is responsible for your use.',
              { p0: MINIMUM_AGE }
            )}
          </p>
          <p className="mt-6">
            {t(
              'If we learn that an account belongs to someone below the minimum age, we will delete it.'
            )}
          </p>
        </div>
        <div className="mt-16 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {t('Plans and payments')}
          </h2>
          <p className="mt-6">
            {t(
              'You can start using Enconvo for free. Some features need a paid plan: a one-time license (Standard, Premium or Teams) or an Enconvo Cloud subscription (Plus, Pro or Max). Prices are shown on the pricing page and at checkout, in US dollars plus any tax.'
            )}
          </p>
          <p className="mt-6">
            {t(
              'A license is paid once and never renews. Standard includes one year of updates; Premium and Teams include lifetime updates.'
            )}
          </p>
        </div>
        <div id="subscriptions" className="mt-16 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {t('Subscriptions and automatic renewal')}
          </h2>
          <p className="mt-6">
            {t(
              'Enconvo Cloud subscriptions renew automatically at the end of each billing period, monthly or yearly as you chose. Until you cancel, we charge your payment method the price shown when you subscribed, plus any tax, at the start of each period.'
            )}
          </p>
          <p className="mt-6">
            <I18nText
              source={
                'You can cancel at any time under Manage billing on your {p0} page. Canceling stops the next renewal, and your plan stays active until the end of the period you have paid for.'
              }
              values={{
                p0: (
                  <Link className="text-indigo-600" href="/account">
                    {t('Account')}
                  </Link>
                ),
              }}
            />
          </p>
          <p className="mt-6">
            {t(
              'If we change the price of your subscription, we will tell you by email before your next renewal at the new price, so you can cancel first.'
            )}
          </p>
          <p className="mt-6">
            {t(
              'Payments for Enconvo Cloud subscriptions and top-up packs are not refunded, except where the law requires it.'
            )}
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
        <div id="copyright" className="mt-16 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {t('Copyright and DMCA notices')}
          </h2>
          <p className="mt-6">
            {t(
              'We respect intellectual property rights and respond to notices of alleged copyright infringement under the U.S. Digital Millennium Copyright Act (17 U.S.C. § 512). This covers content that people make available through Enconvo, such as plugins in the Plugin Store, shared chat pages and posts on feedback.enconvo.com.'
            )}
          </p>
          <p className="mt-6">
            {t(
              'To report infringement, send our designated agent a written notice that includes:'
            )}
          </p>
          <ol
            role="list"
            className="mt-4 list-decimal space-y-2 pl-6 text-gray-600"
          >
            <li>{t('your physical or electronic signature;')}</li>
            <li>{t('the copyrighted work you believe is infringed;')}</li>
            <li>
              {t(
                'the material you believe infringes it, and where we can find it, such as its URL;'
              )}
            </li>
            <li>
              {t(
                'your name, postal address, telephone number and email address;'
              )}
            </li>
            <li>
              {t(
                'a statement that you believe in good faith that the use is not authorized by the copyright owner, its agent or the law; and'
              )}
            </li>
            <li>
              {t(
                'a statement, under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act for the owner.'
              )}
            </li>
          </ol>
          {DMCA_AGENT ? (
            <address className="mt-6 not-italic">
              <strong className="font-semibold text-gray-900">
                {t('Designated agent')}
              </strong>
              <br />
              {DMCA_AGENT.name}
              <br />
              {DMCA_AGENT.address}
              <br />
              {DMCA_AGENT.phone}
              <br />
              <a
                className="text-indigo-600"
                href={`mailto:${DMCA_AGENT.email}`}
              >
                {DMCA_AGENT.email}
              </a>
            </address>
          ) : (
            <p className="mt-6">
              <I18nText
                source={'Send copyright notices to {p0}.'}
                values={{
                  p0: (
                    <a
                      className="text-indigo-600"
                      href={`mailto:${COPYRIGHT_NOTICE_EMAIL}`}
                    >
                      {COPYRIGHT_NOTICE_EMAIL}
                    </a>
                  ),
                }}
              />
            </p>
          )}
          <p className="mt-6">
            {t(
              'If we remove or disable material because of a notice, we will tell the person who made it available. They may send our designated agent a counter-notice under 17 U.S.C. § 512(g)(3). We may restore the material 10 to 14 business days after we receive a valid counter-notice, unless the person who sent the original notice tells us they have filed a court action. In appropriate circumstances, we close the accounts of people who repeatedly infringe.'
            )}
          </p>
        </div>
        <div className="mt-16 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {t('Acceptable use')}
          </h2>
          <p className="mt-6">
            {t(
              'You may not use Enconvo Cloud for anything illegal or harmful to others, including sexual content involving minors, instructions for serious crimes or violence, threats, and calls for hatred or violence against groups. You must also follow the usage policies of the model providers you reach through Enconvo Cloud.'
            )}
          </p>
          <p className="mt-6">
            {t(
              'Enconvo Cloud may refuse a message that appears to break these rules. If an account keeps sending such messages, we may pause or suspend its Cloud AI, and a provider may restrict the account on its side. You can still sign in, manage or cancel your subscription, and delete your account. If you think we got it wrong, write to support@enconvo.com.'
            )}
          </p>
          <p className="mt-6">{t('This section takes effect on November 14, 2026.')}</p>
        </div>
        <div className="mt-16 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {t('Changes to these terms')}
          </h2>
          <p className="mt-6">
            {t(
              'We may update these terms as Enconvo changes. We will post the new version on this page and update the date at the top. If a change materially affects your rights or a paid plan, we will tell you in the app or by email before it takes effect.'
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
