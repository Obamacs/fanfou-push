import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects: async () => [
    {
      source: "/:path*",
      has: [
        {
          type: "host",
          value: "www.meal-meet.com",
        },
      ],
      destination: "https://meal-meet.com/:path*",
      permanent: true,
    },
  ],
};

export default nextConfig;
