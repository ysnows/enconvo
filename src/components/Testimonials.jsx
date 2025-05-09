import Image from 'next/image'

import { Container } from '@/components/Container'
import avatarImage1 from '@/images/avatars/avatar-1.png'
import avatarImage2 from '@/images/avatars/avatar-2.png'
import avatarImage3 from '@/images/avatars/avatar-3.png'
import avatarImage4 from '@/images/avatars/avatar-4.png'
import avatarImage5 from '@/images/avatars/avatar-5.png'
import avatarImage6 from '@/images/avatars/avatar-6.png'

// Testimonials data showcasing user experiences with EnConvo's various features
const testimonials = [
  [
    {
      content:
        "I'm thrilled to have found Enconvo! After using Beam until it stopped updates and then Bolt AI, which lacks those helpful floating desktop integration, Enconvo is perfect. Huge thanks to the team for their hard work. I hope they get the recognition they deserve.",
      author: {
        name: 'Rodgomesc',
        role: 'Developer',
        image: avatarImage1,
      },
    },
    {
      content: 
        'The context awareness feature is a game changer. Being able to select text anywhere and instantly access AI assistance through PopBar has dramatically improved my workflow. The voice input and image generation capabilities are icing on the cake.',
      author: {
        name: 'Sarah Chen',
        role: 'Software Developer',
        image: avatarImage4,
      },
    },
  ],
  [
    {
      content:
        'The knowledge base integration is brilliant - I can seamlessly search through my documents and get AI-powered insights. The workflow customization lets me combine plugins exactly how I need them. EnConvo has become an indispensable part of my daily work.',
      author: {
        name: 'Michael Torres',
        role: 'Product Manager',
        image: avatarImage5,
      },
    },
    {
      content:
        'As a content creator, the AI web search and image generation features save me hours of work. The plugin system is incredibly versatile - I\'ve created custom workflows that perfectly match my creative process. Truly an all-in-one solution.',
      author: {
        name: 'Emma Wilson',
        role: 'Content Strategist',
        image: avatarImage2,
      },
    },
  ],
  [
    {
      content:
        'The Spotlight-like smart bar is incredibly intuitive. I love how it understands context from my browser tabs and Finder selections. The live closed captions feature is fantastic for accessibility. EnConvo thinks of everything!',
      author: {
        name: 'David Park',
        role: 'UX Designer',
        image: avatarImage3,
      },
    },
    {
      content:
        'Having over 100 plugins available means I can extend functionality however I need. The voice input method is surprisingly accurate, and the OCR capabilities are excellent. This tool has revolutionized how I interact with AI on my Mac.',
      author: {
        name: 'Rachel Martinez',
        role: 'Technical Writer',
        image: avatarImage6,
      },
    },
  ],
]

// Quote icon component for testimonial cards
function QuoteIcon(props) {
  return (
    <svg aria-hidden="true" width={105} height={78} {...props}>
      <path d="M25.086 77.292c-4.821 0-9.115-1.205-12.882-3.616-3.767-2.561-6.78-6.102-9.04-10.622C1.054 58.534 0 53.411 0 47.686c0-5.273.904-10.396 2.712-15.368 1.959-4.972 4.746-9.567 8.362-13.786a59.042 59.042 0 0 1 12.43-11.3C28.325 3.917 33.599 1.507 39.324 0l11.074 13.786c-6.479 2.561-11.677 5.951-15.594 10.17-3.767 4.219-5.65 7.835-5.65 10.848 0 1.356.377 2.863 1.13 4.52.904 1.507 2.637 3.089 5.198 4.746 3.767 2.41 6.328 4.972 7.684 7.684 1.507 2.561 2.26 5.5 2.26 8.814 0 5.123-1.959 9.19-5.876 12.204-3.767 3.013-8.588 4.52-14.464 4.52Zm54.24 0c-4.821 0-9.115-1.205-12.882-3.616-3.767-2.561-6.78-6.102-9.04-10.622-2.11-4.52-3.164-9.643-3.164-15.368 0-5.273.904-10.396 2.712-15.368 1.959-4.972 4.746-9.567 8.362-13.786a59.042 59.042 0 0 1 12.43-11.3C82.565 3.917 87.839 1.507 93.564 0l11.074 13.786c-6.479 2.561-11.677 5.951-15.594 10.17-3.767 4.219-5.65 7.835-5.65 10.848 0 1.356.377 2.863 1.13 4.52.904 1.507 2.637 3.089 5.198 4.746 3.767 2.41 6.328 4.972 7.684 7.684 1.507 2.561 2.26 5.5 2.26 8.814 0 5.123-1.959 9.19-5.876 12.204-3.767 3.013-8.588 4.52-14.464 4.52Z" />
    </svg>
  )
}

export function Testimonials() {
  return (
    <section
      id="testimonials"
      aria-label="What our customers are saying"
      className="bg-slate-900 py-20 sm:py-32"
    >
      <Container>
        <div className="mx-auto max-w-2xl md:text-center">
          <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl">
            Loved by users worldwide
          </h2>
          <p className="mt-4 text-lg tracking-tight text-slate-400">
            See what our users are saying about their experience with EnConvo&apos;s AI-powered features and workflow integrations.
          </p>
        </div>
        <ul
          role="list"
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:gap-8 lg:mt-20 lg:max-w-none lg:grid-cols-3"
        >
          {testimonials.map((column, columnIndex) => (
            <li key={columnIndex}>
              <ul role="list" className="flex flex-col gap-y-6 sm:gap-y-8">
                {column.map((testimonial, testimonialIndex) => (
                  <li key={testimonialIndex}>
                    <figure className="relative rounded-2xl bg-slate-800/50 p-6 shadow-xl shadow-slate-900/10">
                      <QuoteIcon className="absolute left-6 top-6 fill-slate-700" />
                      <blockquote className="relative">
                        <p className="text-lg tracking-tight text-slate-200">
                          {testimonial.content}
                        </p>
                      </blockquote>
                      <figcaption className="relative mt-6 flex items-center justify-between border-t border-slate-700/50 pt-6">
                        <div>
                          <div className="font-display text-base text-slate-200">
                            {testimonial.author.name}
                          </div>
                          <div className="mt-1 text-sm text-slate-400">
                            {testimonial.author.role}
                          </div>
                        </div>
                        <div className="overflow-hidden rounded-full bg-slate-800">
                          <Image
                            className="h-14 w-14 object-cover"
                            src={testimonial.author.image}
                            alt=""
                            width={56}
                            height={56}
                          />
                        </div>
                      </figcaption>
                    </figure>
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
