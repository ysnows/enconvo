import { Container } from '@/components/Container'

const faqs = [
  [
    {
      question: 'Is Enconvo free to use?',
      answer: 'Yes. The free tier includes every core feature, with unlimited AI when you bring your own API key or run local models. Paid tiers remove creation caps (knowledge bases, workflows) and add Cloud points.',
    },
    {
      question: 'Do I need my own API key?',
      answer: 'No. Cloud plans include a monthly point allowance with zero key setup. If you prefer your own keys or local models, that usage is free and unlimited on every tier — including the free one.',
    },
    {
      question: 'Can I use my existing ChatGPT, Claude, or Grok subscription?',
      answer: 'Yes. Sign in with those accounts and Enconvo can use the subscriptions you already pay for, right inside the app.',
    },
  ],
  [
    {
      question: 'Does Enconvo use my data for training?',
      answer: 'No, we do not use any user data for training. All data is encrypted during transmission and we only store basic usage analytics. Your data is never stored on our servers.',
    },
    {
      question: 'Is Enconvo an Electron app?',
      answer: 'No, Enconvo is a native macOS application built for optimal performance and system integration.',
    },
    {
      question: 'Can Enconvo work fully offline?',
      answer: 'Yes. Run local models through MLX, Ollama, or LM Studio — including on-device speech recognition — and your data never leaves your Mac.',
    },
  ],
  [
    {
      question: 'What is your refund policy?',
      answer: 'We offer a 14-day no-questions-asked refund policy for Lifetime Licenses. For Subscription plans, you can cancel your subscription at any time.',
    },
    {
      question: 'Is Enconvo open source?',
      answer: 'While Enconvo itself is not open source, all Enconvo extensions are open source and can be found on https://github.com/enconvo',
    },
    {
      question: 'Student Discount?',
      answer: 'We offer a 30% discount for students. Please contact us by sending an email to support@enconvo.com to get your discount code.',
    }
  ],
]

export function Faqs() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="bg-canvas py-20 sm:py-32"
    >
      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="faq-title"
            className="font-display text-3xl tracking-tight text-content sm:text-4xl"
          >
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg tracking-tight text-content-muted">
            If you can&apos;t find what you&apos;re looking for, email our support team
            and if you&apos;re lucky someone will get back to you.
          </p>
        </div>
        <ul
          role="list"
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3"
        >
          {faqs.map((column, columnIndex) => (
            <li key={columnIndex}>
              <ul role="list" className="flex flex-col gap-y-8">
                {column.map((faq, faqIndex) => (
                  <li key={faqIndex} className="group relative rounded-lg bg-surface-card p-6 border border-hairline hover:border-hairline-strong transition-colors">
                    <h3 className="font-display text-lg leading-7 text-content group-hover:text-signal-blue transition-colors">
                      {faq.question}
                    </h3>
                    <p className="mt-4 text-sm text-content-muted group-hover:text-content-body transition-colors">{faq.answer}</p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
