import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { UseCaseGallery } from '@/components/UseCaseGallery'
import { useCases } from '@/data/useCases'
import { newestFirst } from '@/lib/useCaseDiscovery'
import styles from '@/styles/Discovery.module.css'

// The same catalogue as /use-cases, previewed six cards at a time, so a new
// walkthrough shows up here as soon as it's added.
const catalogue = newestFirst(useCases)
const PREVIEW_COUNT = 6

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
        <UseCaseGallery items={catalogue} limit={PREVIEW_COUNT} />
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
