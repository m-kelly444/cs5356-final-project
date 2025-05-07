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
  
  // Add this to skip ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Add this to skip type checking during builds
  typescript: {
    ignoreBuildErrors: true,
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