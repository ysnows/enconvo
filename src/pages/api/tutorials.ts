import type { NextApiRequest, NextApiResponse } from 'next'
import { useCases } from '@/data/useCases'
import { newestFirst } from '@/lib/useCaseDiscovery'

/**
 * The walkthroughs and update videos of /use-cases as JSON, newest first. The Enconvo app
 * reads it for Settings > Tutorials (modules/enconvo/src/api/tutorials.ts there), so a video
 * added to src/data/useCases.ts shows in the app without an app release.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  // Only what the app reads: fields the site keeps for its own pages stay here.
  const items = newestFirst(useCases).map((item) => ({
    slug: item.slug,
    title: item.title,
    description: item.description,
    youtubeId: item.youtubeId,
    category: item.category,
    date: item.date,
    docsUrl: item.docsUrl,
    version: item.version,
  }))
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400')
  res.status(200).json({ items })
}
