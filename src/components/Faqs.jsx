import { Container } from '@/components/Container'

// FAQ data with questions and answers
const faqs = [
  [
    {
      question: 'Is EnConvo an Electron app?',
      answer: 'No, EnConvo is a native macOS application built for optimal performance and system integration.',
    },
    {
      question: 'Is EnConvo free to use?',
      answer: 'EnConvo offers a free trial with 10 uses per day. We also provide lifetime licenses and subscription plans for full access.',
    },
    {
      question: 'Does EnConvo use my data for training?',
      answer: 'No, we do not use any user data for training. All data is encrypted during transmission and we only store basic usage analytics. Your data is never stored on our servers.',
    },
  ],
  [
    {
      question: 'What is your refund policy?',
      answer: 'We offer a 30-day no-questions-asked refund policy for Lifetime Licenses. For Subscription plans, you can cancel your subscription at any time .',
    },
    {
      question: 'What platforms does EnConvo support?',
      answer: 'EnConvo currently only supports macOS, and has been optimized for native macOS performance and system integration.',
    },
    {
      question: 'Is Enconvo open source?',
      answer: 'While Enconvo itself is not open source, all Enconvo extensions are open source and can be found on https://github.com/enconvo',
    },
  ],
  [
    {
      question: 'Do you offer technical support?',
      answer: 'Yes, you can join our Discord community for technical support. Our team and community members are there to help you get the most out of EnConvo.',
    },
    {
      question: 'How often do you release updates?',
      answer: 'We regularly release updates with new features, improvements, and bug fixes. All updates are free for existing users within their license period.',
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
      className="bg-slate-900 py-20 sm:py-32"
    >
      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="faq-title"
            className="font-display text-3xl tracking-tight text-white sm:text-4xl"
          >
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg tracking-tight text-slate-400">
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
                  <li key={faqIndex} className="group relative rounded-2xl bg-slate-800/50 p-6 hover:bg-slate-800/75 transition-colors duration-300">
                    <h3 className="font-display text-lg leading-7 text-white group-hover:text-sky-300 transition-colors duration-300">
                      {faq.question}
                    </h3>
                    <p className="mt-4 text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-300">{faq.answer}</p>
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
