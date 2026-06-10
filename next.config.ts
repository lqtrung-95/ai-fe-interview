import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Client Router Cache: reuse a visited dynamic page segment for 30s so
    // sidebar back-and-forth navigation renders instantly instead of
    // re-running the full server waterfall (auth + DB) and flashing the
    // route skeleton. Mutations that must be visible immediately should call
    // router.refresh() / revalidatePath. Still experimental in Next 16.
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;
