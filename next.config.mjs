// next.config.mjs

const nextConfig = {
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'export',
};

export default nextConfig;
