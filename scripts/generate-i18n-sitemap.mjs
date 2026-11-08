import { readFile, writeFile } from 'node:fs/promises'
const { locales, defaultLocale } = JSON.parse(
  await readFile(new URL('../src/i18n/config.json', import.meta.url), 'utf8')
)
const paths = [
  '/',
  '/use-cases',
  '/android',
  '/cloud-pricing',
  '/changelog',
  '/privacy',
  '/terms',
]
const url = (path, locale) =>
  `https://www.enconvo.com${
    locale === defaultLocale ? path : `/${locale}${path === '/' ? '' : path}`
  }`
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${paths
  .flatMap((path) =>
    locales.map(
      (locale) => `  <url>
    <loc>${url(path, locale)}</loc>
${locales
  .map(
    (alternate) =>
      `    <xhtml:link rel="alternate" hreflang="${alternate}" href="${url(
        path,
        alternate
      )}" />`
  )
  .join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${url(
      path,
      defaultLocale
    )}" />
  </url>`
    )
  )
  .join('\n')}
</urlset>
`
await writeFile(new URL('../public/sitemap.xml', import.meta.url), xml)
console.log(
  `Generated ${paths.length * locales.length} localized sitemap entries`
)
