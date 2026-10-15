// The link-preview crawlers that credit a shared link to the page's og:url (src/pages/go).
const SHARE_CRAWLER = {
  type: 'header',
  key: 'user-agent',
  value: '.*(?:facebookexternalhit|Facebot|LinkedInBot).*',
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: require('./src/i18n/config.json'),
  experimental: {
    scrollRestoration: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
      },
      {
        protocol: 'https',
        hostname: '*.enconvo.com',
      },
    ],
  },
  async rewrites() {
    // The Plugins store is the enconvo-app Worker's (envonvo.api.workers/enconvo-app/plugins.js),
    // which answers /<locale>/plugins in that language. A locale: false source names its locale,
    // and an address without one is the default locale's (/en/...).
    const store = 'https://app.enconvo.com'
    const lang = `:lang(${require('./src/i18n/config.json')
      .locales.filter((locale) => locale !== 'en')
      .join('|')})`
    return [
      { source: '/en/plugins', destination: `${store}/plugins`, locale: false },
      { source: '/en/plugins/:path*', destination: `${store}/plugins/:path*`, locale: false },
      { source: `/${lang}/plugins`, destination: `${store}/:lang/plugins`, locale: false },
      { source: `/${lang}/plugins/:path*`, destination: `${store}/:lang/plugins/:path*`, locale: false },
      // The PopBar extension icons the store shows.
      { source: '/en/popbar-extensions/icons/:path*', destination: `${store}/popbar-extensions/icons/:path*`, locale: false },
    ]
  },
  async redirects() {
    return [
      {
        source: '/cloud-plan',
        destination: '/cloud-pricing',
        permanent: true,
      },
      {
        // Plans live in the homepage pricing section; older links and
        // the login returnUrl still use /pricing.
        source: '/pricing',
        destination: '/#pricing',
        permanent: false,
      },
      {
        // Short Affiliate links for videos, podcasts and print: /go/kenmoo opens
        // /?via=kenmoo and /go/kenmoo/podcast adds the sub ID. Other query values
        // pass through. The patterns mirror the Worker's code and sub ID rules.
        // Facebook's and LinkedIn's crawlers get src/pages/go instead, whose og:url
        // keeps a shared post's link on the short link.
        source:
          '/go/:code([A-Za-z0-9][A-Za-z0-9_-]{2,31})/:sub([A-Za-z0-9][A-Za-z0-9_.-]{0,63})',
        missing: [SHARE_CRAWLER],
        destination: '/?via=:code&sub=:sub',
        permanent: false,
      },
      {
        source: '/go/:code([A-Za-z0-9][A-Za-z0-9_-]{2,31})',
        missing: [SHARE_CRAWLER],
        destination: '/?via=:code',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
