/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        scrollRestoration: true,
    },
    images: {
        domains: ['raw.githubusercontent.com','github.com'],
    },
}

module.exports = nextConfig
