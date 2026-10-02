/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
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
                source: '/go/:code([A-Za-z0-9][A-Za-z0-9_-]{2,31})/:sub([A-Za-z0-9][A-Za-z0-9_.-]{0,63})',
                destination: '/?via=:code&sub=:sub',
                permanent: false,
            },
            {
                source: '/go/:code([A-Za-z0-9][A-Za-z0-9_-]{2,31})',
                destination: '/?via=:code',
                permanent: false,
            },
        ]
    },
}

module.exports = nextConfig
