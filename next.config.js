/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.snapshot = {
      ...config.snapshot,
      managedPaths: [/^(.+?[\\/]node_modules[\\/])/],
    }
    return config
  },
}
module.exports = nextConfig
