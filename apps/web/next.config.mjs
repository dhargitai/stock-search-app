/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    typedRoutes: true,
  },
  transpilePackages: ["@peak-finance/db"],
  eslint: {
    dirs: ["src"],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;