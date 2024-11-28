/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        scrollRestoration: true,
    },
    images: {
        domains: ['raw.githubusercontent.com', 'github.com', 'file.enconvo.com'],
    },
}

module.exports = nextConfig
