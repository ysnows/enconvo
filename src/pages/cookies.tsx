import { I18nText } from '@/i18n/I18nText'
import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { canonicalUrl } from '@/i18n/locale'
import Head from 'next/head'
import Link from 'next/link'
import { ReactNode } from 'react'
import { openCookieSettings } from '@/lib/cookie-consent'

// An ISO date parses as UTC midnight, so the UTC format below shows this day in every time zone.
const LAST_UPDATED = '2026-10-25'
const SUPPORT_EMAIL = 'support@enconvo.com'

type Row = { name: string; purpose: string; provider: string; duration: string }

// Every cookie and browser storage item enconvo.com writes, by category (lib/cookie-consent).
// Keep this in step with that file when a page starts storing something new.
const NECESSARY: Row[] = [
  {
    name: 'sb-…-auth-token',
    purpose: 'Keeps you signed in to your Enconvo account.',
    provider: 'Enconvo (Supabase)',
    duration: 'Until you sign out',
  },
  {
    name: 'NEXT_LOCALE',
    purpose: 'Remembers the language you chose for this website.',
    provider: 'Enconvo',
    duration: '1 year',
  },
  {
    name: 'enconvo_consent',
    purpose: 'Remembers your cookie choices.',
    provider: 'Enconvo',
    duration: '6 months',
  },
  {
    name: 'enconvo_invite',
    purpose:
      'Keeps an Invite link you opened, so it can be redeemed after you sign in.',
    provider: 'Enconvo',
    duration: '7 days',
  },
  {
    name: 'enconvo_offer',
    purpose:
      'Keeps a Welcome offer link you opened, so it can be claimed after you sign in.',
    provider: 'Enconvo',
    duration: '7 days',
  },
  {
    name: '__stripe_mid, __stripe_sid',
    purpose: 'Stripe fraud prevention, set only on the payment page.',
    provider: 'Stripe',
    duration: '1 year, or 30 minutes',
  },
  {
    name: 'enconvo_age_check',
    purpose: 'Keeps the sign-up age check from being answered again right after it failed.',
    provider: 'Enconvo',
    duration: '1 day',
  },
  {
    name: 'enconvo_offer_dismissed, enconvo_welcome_offer_dismissed',
    purpose: 'Remembers that you closed an offer notice (browser storage).',
    provider: 'Enconvo',
    duration: 'Until you clear it',
  },
  {
    name: 'enconvo:registration-product-updates, enconvo:registration-age',
    purpose:
      'Carries your sign-up choices through Google sign-in (browser storage).',
    provider: 'Enconvo',
    duration: '15 minutes',
  },
]

const ANALYTICS: Row[] = [
  {
    name: '_ga, _ga_JBLMBKBEN2',
    purpose:
      'Google Analytics: tells visits apart to count visits, downloads and sign-ups.',
    provider: 'Google',
    duration: '2 years',
  },
  {
    name: 'enconvo_signup_reported_v1, enconvo_google_signup_intent_v1',
    purpose: 'Keeps a sign-up from being counted twice (browser storage).',
    provider: 'Enconvo',
    duration: 'Until you clear it, or the browser session',
  },
]

const MARKETING: Row[] = [
  {
    name: 'enconvo_utm',
    purpose:
      'Remembers the campaign link that brought you, so we can see what our campaigns bring.',
    provider: 'Enconvo',
    duration: '90 days',
  },
  {
    name: 'enconvo_via',
    purpose:
      'Remembers the partner (Affiliate) link that brought you, so the partner is credited for a purchase.',
    provider: 'Enconvo',
    duration: '90 days',
  },
  {
    name: 'enconvo_marketing_referral_v1',
    purpose:
      'Remembers the partner website that referred you (browser storage).',
    provider: 'Enconvo',
    duration: '30 days',
  },
  {
    name: 'enconvo_utm:…, enconvo_via:…',
    purpose:
      'Holds a campaign or partner visit until it reaches our server (browser storage).',
    provider: 'Enconvo',
    duration: 'Up to 48 hours, or the browser session',
  },
]

function Section({
  id,
  title,
  children,
}: {
  id?: string
  title: string
  children: ReactNode
}) {
  const { t } = useI18n()

  return (
    <section id={id} className="mt-16 max-w-2xl">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">
        {t(title)}
      </h2>
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  )
}

function Table({ rows }: { rows: Row[] }) {
  const { t } = useI18n()

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-900">
            <th className="py-2 pr-4 font-semibold">{t('Name')}</th>
            <th className="py-2 pr-4 font-semibold">{t('Purpose')}</th>
            <th className="py-2 pr-4 font-semibold">{t('Provider')}</th>
            <th className="py-2 font-semibold">{t('Kept for')}</th>
          </tr>
        </thead>
        <tbody className="text-gray-600">
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-gray-100 align-top">
              <td className="break-all py-2 pr-4 font-mono text-xs text-gray-900">
                {row.name}
              </td>
              <td className="py-2 pr-4">{t(row.purpose)}</td>
              <td className="py-2 pr-4">{row.provider}</td>
              <td className="py-2">{t(row.duration)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Cookies() {
  const { t, locale } = useI18n()

  return (
    <div className="bg-white px-6 py-32 lg:px-8">
      <Head>
        <title>{t('Enconvo Cookie Policy')}</title>
        <meta
          name="description"
          content={t(
            'Which cookies and browser storage enconvo.com uses, why, and how to change your choice.'
          )}
        />
        <link
          rel="canonical"
          href={canonicalUrl('/cookies', locale)}
          key="canonical"
        />
      </Head>
      <div className="mx-auto max-w-3xl text-base leading-7 text-gray-700">
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {t('Cookie Policy')}
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
            'This policy explains the cookies and similar browser storage that the website enconvo.com uses. Cookies are small files a website saves in your browser. The Enconvo apps are covered by our Privacy Policy.'
          )}
        </p>
        <p className="mt-6">
          <button
            type="button"
            onClick={openCookieSettings}
            className="inline-flex h-9 items-center rounded-[10px] bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-800"
          >
            {t('Change cookie settings')}
          </button>
        </p>

        <Section title="Your choice">
          <p>
            {t(
              'Strictly necessary cookies are always on, because the website cannot work without them. Analytics and marketing cookies are off until you allow them in the cookie banner. You can change or withdraw your choice at any time with Cookie settings at the bottom of every page; when you withdraw, we delete what that category stored. We ask again after 6 months.'
            )}
          </p>
        </Section>

        <Section title="Strictly necessary">
          <Table rows={NECESSARY} />
        </Section>

        <Section title="Analytics">
          <p>
            {t(
              'Only with your consent, we use Google Analytics to measure visits, downloads and sign-ups, so we know which pages help people. Google receives your IP address and a browser identifier and may process them in the United States. Advertising features and Google signals are off.'
            )}
          </p>
          <Table rows={ANALYTICS} />
        </Section>

        <Section title="Marketing">
          <p>
            {t(
              'Only with your consent, we remember which campaign or partner link brought you, so we can credit the partner who referred you and judge our campaigns. If you decline, a partner discount is not applied automatically; you can still enter the partner’s code at checkout.'
            )}
          </p>
          <Table rows={MARKETING} />
        </Section>

        <Section title="Other websites">
          <p>
            {t(
              'Checkout runs on Stripe and Google sign-in runs on Google. Their pages set their own cookies under their own policies.'
            )}
          </p>
        </Section>

        <Section title="Contact Us">
          <p>
            <I18nText
              source={
                'Questions about cookies? Email {p0}. Our {p1} explains how we handle personal data.'
              }
              values={{
                p0: (
                  <a
                    className="text-indigo-600"
                    href={`mailto:${SUPPORT_EMAIL}`}
                  >
                    {SUPPORT_EMAIL}
                  </a>
                ),
                p1: (
                  <Link className="text-indigo-600" href="/privacy">
                    {t('Privacy Policy')}
                  </Link>
                ),
              }}
            />
          </p>
        </Section>
      </div>
    </div>
  )
}

export const getStaticProps = i18nStaticProps('/cookies')
