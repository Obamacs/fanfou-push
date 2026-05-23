import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "meal-meet.com",
        pathname: "/api/supabase/**",
      },
      {
        protocol: "https",
        hostname: "lwercdnrvxrsnjjvojfx.supabase.co",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=self",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: blob: https://lwercdnrvxrsnjjvojfx.supabase.co https://webapi.amap.com; " +
              "connect-src 'self' https://lwercdnrvxrsnjjvojfx.supabase.co https://api.anthropic.com https://checkout.stripe.com https://api.resend.com wss://ws.pusherapp.com; " +
              "font-src 'self'; " +
              "frame-src https://checkout.stripe.com; " +
              "object-src 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self';",
          },
        ],
      },
    ];
  },
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
