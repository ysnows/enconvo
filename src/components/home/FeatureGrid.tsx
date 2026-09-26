import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { UseCaseGallery } from '@/components/UseCaseGallery'
import { useCases } from '@/data/useCases'
import styles from '@/styles/Discovery.module.css'

// Curated real walkthroughs, reusing the catalogue's stable deep links.
const FEATURED_SLUGS = [
  'excel-sidebar-ai',
  'resume-to-personal-website',
  'popbar-instant-actions',
  'browser-use-agent',
  'gmail-weather-workflow',
  'seamless-ocr',
]
const featured = FEATURED_SLUGS.map((slug) =>
  useCases.find((item) => item.slug === slug)
).filter((item): item is NonNullable<typeof item> => Boolean(item))

export function FeatureGrid() {
  return (
    <section
      id="features"
      aria-labelledby="discovery-title"
      className={styles.section}
    >
      <div className={styles.container}>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>Made for the work you do.</p>
            <h2 id="discovery-title">What will you do with Enconvo?</h2>
            <p className={styles.intro}>
              Write, research, build, and take care of the everyday. See real
              tasks come together on a Mac, one walkthrough at a time.
            </p>
          </div>
          <Link href="/use-cases" className={styles.allLink}>
            All walkthroughs <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <UseCaseGallery items={featured} />
        <div className={styles.footnote}>
          <p>
            100+ built-in AI tools for writing, search, translation, and more.
          </p>
          <p>
            Make them your own with{' '}
            <a href="#platform">plugins, skills &amp; workflows</a>.
          </p>
        </div>
      </div>
    </section>
  )
}
