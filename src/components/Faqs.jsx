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
      answer: 'We offer a 7-day no-questions-asked refund policy. Your satisfaction is our priority.',
    },
    {
      question: 'What platforms does EnConvo support?',
      answer: 'EnConvo currently only supports macOS, and has been optimized for native macOS performance and system integration.',
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
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2
            id="faq-title"
            className="font-display text-3xl tracking-tight text-white sm:text-4xl"
          >
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg tracking-tight text-slate-400">
            If you can't find what you're looking for, email our support team
            and if you're lucky someone will get back to you.
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
                  <li key={faqIndex}>
                    <h3 className="font-display text-lg leading-7 text-white">
                      {faq.question}
                    </h3>
                    <p className="mt-4 text-sm text-slate-400">{faq.answer}</p>
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
