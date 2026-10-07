import { I18nText } from '@/i18n/I18nText'
import { i18nStaticProps } from '@/i18n/server'
import { useI18n } from '@/i18n/I18nProvider'
import { canonicalUrl } from '@/i18n/locale'
import Head from 'next/head'
import Link from 'next/link'
import { ReactNode } from 'react'

const LAST_UPDATED = 'October 7, 2026'
const SUPPORT_EMAIL = 'support@enconvo.com'

function Section({
  id,
  title,
  children,
}: {
  id?: string
  title: string
  children: ReactNode
}) {
  const { t, locale } = useI18n()

  return (
    <section id={id} className="mt-16 max-w-2xl">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">
        {t(title)}
      </h2>
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  )
}

function Items({ children }: { children: ReactNode }) {
  return (
    <ul role="list" className="list-disc space-y-3 pl-6 text-gray-600">
      {children}
    </ul>
  )
}

function Item({ title, children }: { title?: string; children: ReactNode }) {
  const { t, locale } = useI18n()

  return (
    <li>
      {title && (
        <strong className="font-semibold text-gray-900">{t(title)}. </strong>
      )}
      {children}
    </li>
  )
}

function ExternalLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <a
      className="text-indigo-600"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  )
}

export default function Privacy() {
  const { t, locale } = useI18n()

  return (
    <div className="bg-white px-6 py-32 lg:px-8">
      <Head>
        <title>{t('Enconvo Privacy Policy')}</title>
        <meta
          name="description"
          content={t(
            'How Enconvo collects, uses, stores, and shares data, including Google user data.'
          )}
        />
        <link
          rel="canonical"
          href={canonicalUrl('/privacy', locale)}
          key="canonical"
        />
      </Head>
      <div className="mx-auto max-w-3xl text-base leading-7 text-gray-700">
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {t('Privacy Policy')}
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
            'Enconvo is an AI assistant for your computer, iPhone and Android. Enconvo is developed by THE GREAT LIONHEART PTE. LTD. ("Enconvo", "we", "us"). This policy explains what data the Enconvo desktop app, the Enconvo iPhone and Android apps, the website enconvo.com, and the Enconvo cloud services collect, how we use it, where it is stored, who we share it with, and how you can delete it.'
          )}
        </p>
        <p className="mt-6">
          {t(
            'It does not cover third-party plugins, MCP servers, or AI providers you add yourself. Those are governed by their own privacy policies.'
          )}
        </p>

        <Section title={t('Summary')}>
          <Items>
            <Item>
              {t(
                'Your chats, files, settings, and your own API keys stay on your device unless you use a feature that needs a network service.'
              )}
            </Item>
            <Item>
              {t(
                'We do not sell your data, show ads, or use your content to train AI models.'
              )}
            </Item>
            <Item>
              {t(
                "Google user data is used only to provide the features you ask for in Enconvo, and is handled according to Google's Limited Use requirements (see "
              )}
              <Link className="text-indigo-600" href="#google-user-data">
                {t('Google user data')}
              </Link>
              ).
            </Item>
            <Item>
              {t(
                'You can turn off product analytics at any time in Enconvo Settings.'
              )}
            </Item>
          </Items>
        </Section>

        <Section title={t('Data that stays on your device')}>
          <p>
            {t(
              'Your conversation history, chat sessions, plugin settings, knowledge base, and the API keys you enter for AI providers are stored locally on your device. We do not upload them to our servers. When you use your own API key, Enconvo sends your request directly from your device to that provider.'
            )}
          </p>
          <p>
            {t(
              'Enconvo asks for system permissions only for the features that need them, and only when you use those features:'
            )}
          </p>
          <Items>
            <Item title={t('Accessibility')}>
              {t(
                'Reads the text you have selected and lets agents operate apps when you ask them to.'
              )}
            </Item>
            <Item title={t('Clipboard')}>
              {t(
                'Reads or writes text when you run a command that uses the clipboard.'
              )}{' '}
              {t(
                'Clipboard History, which is on by default, keeps the text, images, and files you copy on your device for the period you choose (three months by default). It skips password managers and content that apps mark as confidential, and you can turn it off or clear it at any time.'
              )}
            </Item>
            <Item title={t('Microphone')}>
              {t(
                'Records audio for dictation, transcription, and voice conversations.'
              )}
            </Item>
            <Item title={t('Screen recording and camera')}>
              {t(
                'Captures the screen or camera when you share it with an agent.'
              )}
            </Item>
            <Item title={t('Calendars, reminders, contacts, and automation')}>
              {t(
                'Lets agents read and update your Apple apps when you ask them to.'
              )}
            </Item>
            <Item title={t('Location')}>
              {t(
                'Shows local weather. Your location is not stored on our servers.'
              )}
            </Item>
          </Items>
        </Section>

        <Section title={t('Your Enconvo account')}>
          <p>
            {t(
              "You need an Enconvo account for Enconvo's cloud features, subscriptions, and the iPhone app. When you sign up with an email and password, or with Google Sign-In, we store:"
            )}
          </p>
          <Items>
            <Item title={t('Profile')}>
              {t(
                'Your email address, your name, and your profile picture if you sign in with Google.'
              )}
            </Item>
            <Item title={t('Devices')}>
              {t(
                "An identifier derived from your computer's hardware (we store a one-way hash, not the serial number itself), the device model and system version, and the IP address and approximate city of the device when it signs in. We use this to apply your plan to your devices and to prevent abuse."
              )}
            </Item>
            <Item title={t('Plan and usage')}>
              {t(
                'Your plan, your points balance, and a usage record for each cloud request: the model or feature used, the command, token counts, and the points charged. Usage records do not contain your prompts or the responses.'
              )}
            </Item>
            <Item title={t('Email preferences')}>
              {t('Whether you want product update emails.')}
            </Item>
          </Items>
        </Section>

        <Section title={t('Payments')}>
          <p>
            {t(
              "Payments are processed by Stripe. We receive and store the plan you bought, the amount, the currency, the purchase and refund dates, and Stripe's reference identifiers. We never receive or store your full card number."
            )}
          </p>
        </Section>

        <Section title={t('Enconvo cloud models and services')}>
          <p>
            {t(
              "When you choose one of Enconvo's built-in cloud models, or a cloud feature such as web search, image or video generation, speech recognition, or text-to-speech, your request passes through our servers to the provider that performs it (for example OpenAI, Anthropic, Google, or the other providers listed in the model picker). The request can include your prompt, the files or context you attach, and any data an agent has gathered for the task."
            )}
          </p>
          <p>
            {t(
              'We use this content only to return the result you asked for. We do not store prompts or responses in our databases. Our servers keep short-lived operational logs, which can include parts of a request, to diagnose failures and prevent abuse. These logs are deleted automatically after at most 7 days. Providers process your request under their own terms for API customers.'
            )}
          </p>
        </Section>

        <Section
          id="third-party-extensions"
          title={t('Third-party extensions')}
        >
          <p>
            {t(
              'Enconvo can run extensions written by other developers, including Raycast-compatible extensions that you import from Raycast, install from a folder, or install from GitHub. These extensions are third-party code. They run on your device in a sandbox that limits them to their own files and the internet. If you give an extension full access, it can also use your files, run programs, and connect to apps and devices on your network. Extensions can send data to services their developers chose. Their developers, not Enconvo, are responsible for how they handle your data, under their own terms and privacy policies.'
            )}
          </p>
          <Items>
            <Item title={t('Installing from GitHub')}>
              {t(
                "When you choose Install in Enconvo on an extension's page on raycast.com, the Enconvo browser extension passes only the extension's name to the Enconvo app on your device. Enconvo then downloads the extension's source code from the public Raycast extensions repository on GitHub and the packages it needs from the npm registry, and builds it on your device without running any of its scripts. Checking for updates downloads the same way. These requests go from your device directly to GitHub and npm and include the names of the extension and its packages, but not your Enconvo account or your files. GitHub and npm handle them under their own privacy policies."
              )}
            </Item>
            <Item title={t('Removal checks')}>
              {t(
                "About twice a day, Enconvo checks the public Raycast extensions repository on GitHub to see whether the extensions you imported from Raycast or installed from GitHub are still listed there. These requests go from your device directly to GitHub and include the names of those extensions, but not your Enconvo account or your files. GitHub handles them under its own privacy policy. Enconvo does not contact Raycast's servers, and does not check extensions you installed from a folder."
              )}
            </Item>
            <Item title={t('Safeguards')}>
              {t(
                'Enconvo asks you to confirm before it imports or installs an extension. An extension must ask before it uses AI, reads your clipboard history, or runs with full access, and you can change these choices under Permissions in Raycast-compatible Extensions. Enconvo turns off extensions that are removed from the public Raycast extensions repository.'
              )}
            </Item>
            <Item title={t('AI requests')}>
              {t(
                "When you allow an extension to use AI, its prompts go to the AI model chosen in Enconvo's settings and are handled as described in Enconvo cloud models and services, or by your own provider if you use your own API key."
              )}
            </Item>
            <Item title={t('Analytics')}>
              {t(
                'Product analytics record actions such as installing or running an extension and the permission choices you make, but never the names of your extensions or what they do.'
              )}
            </Item>
          </Items>
          <p>
            {t(
              'Raycast is a trademark of Raycast Technologies Ltd. Enconvo is not affiliated with, endorsed by, or sponsored by Raycast.'
            )}
          </p>
        </Section>

        <Section title={t('The iPhone app')}>
          <Items>
            <Item title={t('Connection to your computer')}>
              {t(
                'When the iPhone app controls Enconvo on your computer, the connection passes through our relay server end-to-end encrypted. The relay can see only routing information, not the content.'
              )}
            </Item>
            <Item title={t('Phone chats')}>
              {t(
                "Chats you have in the iPhone app itself, their attachments, and your personal instructions are synced through Enconvo's servers so they are available on your devices. They are encrypted at rest but not end-to-end encrypted. You can delete them in the app, or by deleting your account."
              )}
            </Item>
            <Item title={t('Notifications')}>
              {t(
                "We store your iPhone's push notification token to deliver notifications from your computer."
              )}
            </Item>
            <Item title={t('API keys')}>
              {t(
                'Any provider API keys you enter in the iPhone app are kept in the iOS Keychain on your phone.'
              )}
            </Item>
          </Items>
        </Section>

        <Section id="google-user-data" title={t('Google user data')}>
          <p>
            {t(
              'Enconvo accesses Google user data only when you choose to connect a Google account.'
            )}
          </p>
          <Items>
            <Item title={t('Google Sign-In')}>
              {t(
                'We receive your name, email address, and profile picture to create and identify your Enconvo account.'
              )}
            </Item>
            <Item title={t('Gmail')}>
              {t(
                'If you connect Gmail, Enconvo can read, search, and organize your messages and labels, create drafts, and send email on your behalf, but only when you or an agent you are using asks it to.'
              )}
            </Item>
            <Item title={t('Google Calendar')}>
              {t(
                'If you connect Google Calendar, Enconvo can read your calendars and events, find free time, and create, change, or delete events on your behalf, but only when you or an agent you are using asks it to.'
              )}
            </Item>
          </Items>
          <p>
            <I18nText
              source={
                '{p0} We use Google user data only to provide the features you use in Enconvo. For example, we show your emails to you, summarize them, draft replies, or send a message you asked an agent to send, or add an event you asked for. We do not use it for advertising, and we do not use it to create, train, or improve any AI or machine learning model.'
              }
              values={{
                p0: (
                  <strong className="font-semibold text-gray-900">
                    {t('How we use it.')}
                  </strong>
                ),
              }}
            />
          </p>
          <p>
            <I18nText
              source={
                '{p0} Gmail and Google Calendar connections currently run through Composio, a service provider that holds the Google authorization for your Enconvo account. Composio knows your account only by an anonymous account id, not by your email address. Each request goes from your device through our servers to Composio and on to Google, and the result comes back the same way. Our servers pass it through without storing its content. Composio does not store the content either; it keeps a record of which action ran, when, and whether it worked. We do not copy your email or events to our servers. If you set up the older Gmail plugin in an earlier version of Enconvo, its requests go directly from your device to Google, and its authorization token is kept encrypted on your device. Messages and events an agent reads may be saved in your local chat history on your device, and you can delete that history at any time.'
              }
              values={{
                p0: (
                  <strong className="font-semibold text-gray-900">
                    {t('Where it goes and where it is stored.')}
                  </strong>
                ),
              }}
            />
          </p>
          <p>
            <I18nText
              source={
                "{p0} When a task needs email or calendar content, Enconvo includes only the content that task needs in the request to the AI model you selected. If you use one of Enconvo's built-in cloud models, that request passes through our servers as described above. We do not sell Google user data or share it with advertising platforms, data brokers, or information resellers. Apart from Composio, which runs your Gmail and Google Calendar requests as described above, we share it with others only when you ask us to, when it is needed for security, or when the law requires it."
              }
              values={{
                p0: (
                  <strong className="font-semibold text-gray-900">
                    {t('Who we share it with.')}
                  </strong>
                ),
              }}
            />
          </p>
          <p>
            <I18nText
              source={
                '{p0} No person at Enconvo reads your Google user data unless you give us explicit permission for a specific message (for example, in a support request), it is needed to investigate abuse or a security incident, or the law requires it.'
              }
              values={{
                p0: (
                  <strong className="font-semibold text-gray-900">
                    {t('Human access.')}
                  </strong>
                ),
              }}
            />
          </p>
          <p>
            <strong className="font-semibold text-gray-900">
              {t('Removing access.')}
            </strong>{' '}
            {t(
              ' You can disconnect Gmail or Google Calendar in Enconvo at any time, which revokes the authorization and deletes it from Composio; for the older Gmail plugin, it deletes the token from your device. You can also revoke access at '
            )}
            <ExternalLink href="https://myaccount.google.com/permissions">
              {t('myaccount.google.com/permissions')}
            </ExternalLink>
            {t(
              ', where a Gmail or Google Calendar connection is listed under Composio and the older Gmail plugin under Enconvo.'
            )}
          </p>
          <p className="rounded-md bg-gray-50 p-4 text-gray-900">
            {t(
              "Enconvo's use and transfer to any other app of information received from Google APIs will adhere to the "
            )}
            <ExternalLink href="https://developers.google.com/terms/api-services-user-data-policy">
              {t('Google API Services User Data Policy')}
            </ExternalLink>
            {t(', including the Limited Use requirements.')}
          </p>
        </Section>

        <Section title={t('Product analytics')}>
          <p>
            {t(
              'The desktop app sends product analytics to PostHog to help us understand which features work and where they fail. This is on by default, and you can turn it off in Settings > General. Events include the app version, system version, device identifier, plugin and command identifiers, status, and duration. If you are signed in, we link these events to your Enconvo account. Analytics never include your prompts, selected text, clipboard contents, files, emails, API keys, or model responses.'
            )}
          </p>
          <p>
            {t(
              'The website enconvo.com uses Google Analytics to measure visits. The iPhone and Android apps use PostHog only when you turn on Settings > Share usage data. It is off by default for new installations. Events use a device identifier and include feature identifiers, app and system versions, status, counts and duration, never your chat content, files, API keys or email address. You can turn this off at any time.'
            )}
          </p>
        </Section>

        <Section title={t('Service providers')}>
          <p>
            {t(
              'We rely on these providers to operate Enconvo. Each processes data only on our behalf:'
            )}
          </p>
          <Items>
            <Item title={t('Supabase')}>
              {t('Account sign-in and account records.')}
            </Item>
            <Item title={t('Cloudflare')}>
              {t(
                'Our API servers, the iPhone relay, Phone chat sync storage, and operational logs.'
              )}
            </Item>
            <Item title={t('Stripe')}>{t('Payments.')}</Item>
            <Item title={t('PostHog')}>{t('Product analytics.')}</Item>
            <Item title={t('Google Analytics')}>{t('Website analytics.')}</Item>
            <Item title={t('Resend')}>
              {t('Account and product update emails.')}
            </Item>
            <Item title={t('Composio')}>
              {t(
                'Holding the authorization for your Gmail and Google Calendar connections and running those requests with Google.'
              )}
            </Item>
            <Item title={t('AI, speech, and search providers')}>
              {t('Processing the cloud requests you make, as described above.')}
            </Item>
            <Item title={t('Apple')}>
              {t('Push notifications to the iPhone app.')}
            </Item>
          </Items>
        </Section>

        <Section id="account-deletion" title={t('Retention and deletion')}>
          <p>{t("Enconvo for Android handles Phone chats, attachments, personal instructions and AI requests as described for the iPhone app. Push notifications use Google's Firebase Cloud Messaging. In Android Settings > Delete account, you can permanently delete your Enconvo account under the retention terms below. When you use Report AI content, only the content you confirm and the reason you select are sent to Enconvo for private safety review. Reports are kept for up to 30 days and removed when you delete your account.")}</p>
          <p>{t('On iPhone, use Settings > Delete account to permanently delete your Enconvo account, synced Phone and desktop chats and files, and connected-service authorizations. Active Cloud subscriptions are cancelled, and purchased plans and unused points are lost. We retain payment and legally required financial records; publicly licensed work may remain available under its licence. Local data on your other devices is not remotely erased. AI data sharing requires your permission before sending content, and you can withdraw it in Settings > Allow AI data sharing.')}</p>
          <p>
            {t(
              'We keep account, plan, and usage records while your account is active. Operational logs are deleted after at most 7 days. To delete your account and the data tied to it, including synced Phone chats, email us at '
            )}
            <Link className="text-indigo-600" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </Link>{' '}
            {t(
              ' from the address on your account. We complete deletion within 30 days, except for payment records that we must keep by law.'
            )}
          </p>
          <p>
            {t(
              'Data stored only on your device, such as local chat history, is removed when you delete it in Enconvo or uninstall the app and remove its data folder.'
            )}
          </p>
        </Section>

        <Section title={t('Security')}>
          <p>
            {t(
              'Connections to our servers use TLS. Stored data is encrypted at rest by our infrastructure providers. Tokens for connected accounts are encrypted on your device, and access to production systems is limited to the people who operate Enconvo.'
            )}
          </p>
        </Section>

        <Section title={t('Children')}>
          <p>
            {t(
              'Enconvo is not directed to children under 13, and we do not knowingly collect personal data from them.'
            )}
          </p>
        </Section>

        <Section title={t('Changes to this Privacy Policy')}>
          <p>
            {t(
              'We may update this policy as Enconvo changes. We will post the new version on this page and update the date at the top. If a change materially affects how we handle Google user data or other personal data, we will also notify you in the app or by email before it takes effect.'
            )}
          </p>
        </Section>

        <Section title={t('Contact Us')}>
          <p>
            {t(
              'If you have questions about this policy or want to exercise your privacy rights, contact us at '
            )}
            <Link className="text-indigo-600" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </Link>
            .
          </p>
        </Section>
      </div>
    </div>
  )
}

export const getStaticProps = i18nStaticProps('/privacy')
