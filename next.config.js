/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',  // 启用静态导出
    reactStrictMode: true,
    experimental: {
        scrollRestoration: true,
    },
    images: {
        unoptimized: true, // 静态导出需要禁用图片优化
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
}

module.exports = nextConfig
