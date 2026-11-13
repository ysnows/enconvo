import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * The newest Windows or Linux Beta download, read from the update feed the
 * release scripts publish (enconvo-scripts/release-windows.sh and
 * release-linux.sh write file.enconvo.com/<platform>/beta/latest.json). So the
 * /download page always offers the newest Beta without a site change.
 *
 *   /api/desktop-download?platform=windows               redirect to the newest .exe
 *   /api/desktop-download?platform=linux&format=deb      redirect to the newest .deb (also rpm, tar.gz)
 *   /api/desktop-download?platform=windows&info=1        the feed as JSON: { version, files }
 *
 * file.enconvo.com sends no CORS header, so the page can't read the feed
 * itself; this route reads it server-side.
 */

const FEEDS = {
  windows: { base: 'https://file.enconvo.com/win32-x64/beta', formats: ['exe'] },
  linux: {
    base: 'https://file.enconvo.com/linux-x64/beta',
    formats: ['deb', 'rpm', 'tar.gz'],
  },
} as const

type Platform = keyof typeof FEEDS

type Feed = {
  version: string
  files: Record<string, { url: string; size: number; sha256: string }>
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  const platform = String(req.query.platform || '') as Platform
  const feed = FEEDS[platform]
  if (!feed) {
    res.status(400).json({ error: 'platform must be windows or linux' })
    return
  }

  let latest: Feed
  try {
    const response = await fetch(`${feed.base}/latest.json`, { cache: 'no-store' })
    if (!response.ok) throw new Error(`feed answered ${response.status}`)
    latest = (await response.json()) as Feed
  } catch (error) {
    res.status(502).json({ error: 'The update feed could not be read. Try again in a moment.' })
    return
  }

  // A new Beta replaces the feed; a short cache keeps the page current.
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')

  if (req.query.info) {
    const files = Object.fromEntries(
      Object.entries(latest.files).map(([format, file]) => [
        format,
        { url: `${feed.base}/${file.url}`, name: file.url, size: file.size, sha256: file.sha256 },
      ])
    )
    res.status(200).json({ platform, version: latest.version, files })
    return
  }

  const format = String(req.query.format || feed.formats[0])
  const file = latest.files[format]
  if (!file) {
    res.status(404).json({ error: `No ${format} download for ${platform}` })
    return
  }
  res.redirect(302, `${feed.base}/${file.url}`)
}
