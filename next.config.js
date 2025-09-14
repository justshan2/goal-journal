/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 13+
  
  // Add headers for Content Security Policy
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-src 'self'",
            ].join('; ')
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
