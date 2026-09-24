import styles from '@/styles/Home.module.css'
import { Container } from '@/components/Container'

const faqs = [
  [
    {
      question: 'What is Enconvo?',
      answer: 'Enconvo is a native AI assistant and agent for Mac. It works beside your apps, understands screen and selected-text context, and helps with writing, research, app automation, dictation, and document search.',
    },
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
      question: 'Which Macs does Enconvo support?',
      answer: 'Enconvo requires macOS 14 or later and supports both Intel and Apple Silicon Macs. Choose the matching installer from the Download for macOS menu.',
    },
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
      question: 'How do local models and Cloud differ?',
      answer: 'Local models run on your Mac through MLX, Ollama, or LM Studio. Cloud models use online providers. Enconvo Cloud includes points for supported services; you can also bring your own API keys, with any provider charges billed separately.',
    },
    {
      question: 'What is your refund policy?',
      answer: 'Standard, Premium and Teams licenses come with a 30-day money-back guarantee. Request a refund in Enconvo under Settings → Account, or email support@enconvo.com. Enconvo Cloud subscriptions can be canceled at any time.',
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
      className={styles.section}
    >
      <Container className={`${styles.sectionContainer} ${styles.faqLayout} relative`}>
        <div className={`${styles.sectionHeading} ${styles.faqHeading}`} data-reveal>
          <h2
            id="faq-title"
            className="font-display text-3xl tracking-tight text-content sm:text-4xl"
          >
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg tracking-tight text-content-muted">
            Learn how Enconvo works, which Macs it supports, and how to choose
            between local models, your own API keys, and Cloud.
          </p>
        </div>
        <ul
          role="list"
          className={styles.faqList}
        >
          {faqs.map((column, columnIndex) => (
            <li key={columnIndex} data-reveal>
              <ul role="list" className="flex flex-col">
                {column.map((faq, faqIndex) => (
                  <li key={faqIndex} className={`${styles.faqItem} group relative`}>
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
