import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  experimental: {
    // Client Router Cache: reuse a visited dynamic page segment for 30s so
    // sidebar back-and-forth navigation renders instantly instead of
    // re-running the full server waterfall (auth + DB) and flashing the
    // route skeleton. Mutations that must be visible immediately should call
    // router.refresh() / revalidatePath. Still experimental in Next 16.
    staleTimes: {
      dynamic: 30,
    },
    // Tree-shake barrel imports so only the used icons/components are bundled.
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
};

export default nextConfig;
