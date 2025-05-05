/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'images.unsplash.com',
      'nvd.nist.gov',
      'www.cisa.gov',
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['tensorflow'],
  },
  webpack: (config) => {
    // TensorFlow.js specific configurations
    config.resolve.fallback = {
      fs: false,
      path: false,
      os: false,
    };
    return config;
  },
};

module.exports = nextConfig;