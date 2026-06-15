/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://62.72.45.28:3456/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
