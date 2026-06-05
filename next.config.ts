import type { NextConfig } from "next";

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(process.env.NODE_ENV === "development" ? ["'unsafe-eval'"] : []),
  "https://js.stripe.com",
].join(" ");

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
              `script-src ${scriptSrc}; ` +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: blob: https://webapi.amap.com; " +
              "connect-src 'self' https://checkout.stripe.com; " +
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
};

export default nextConfig;
