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
        ]
    },
}

module.exports = nextConfig
