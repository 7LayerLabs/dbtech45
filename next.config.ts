import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    OS_USER: process.env.OS_USER || "derek",
    OS_PASSWORD: process.env.OS_PASSWORD || "caffeine45",
  },
  async rewrites() {
    return {
      // beforeFiles: Next.js pages take priority over proxy rewrites
      beforeFiles: [],
      afterFiles: [
        // Sunday Squares
        {
          source: "/sundaysquares",
          destination: "https://sunday-squares.vercel.app/sundaysquares",
        },
        {
          source: "/sundaysquares/:path*",
          destination: "https://sunday-squares.vercel.app/sundaysquares/:path*",
        },
        // Boundless
        {
          source: "/boundless",
          destination: "https://boundless-ochre.vercel.app/boundless",
        },
        {
          source: "/boundless/:path*",
          destination: "https://boundless-ochre.vercel.app/boundless/:path*",
        },
        // Soulsolace
        {
          source: "/soulsolace",
          destination: "https://soulsolace.vercel.app/soulsolace",
        },
        {
          source: "/soulsolace/:path*",
          destination: "https://soulsolace.vercel.app/soulsolace/:path*",
        },
      ],
      // fallback: for any /os/* path with no matching Next.js page, serve the
      // canonical /ops/* page. (Previously proxied to a Hetzner box that is now
      // dead and never actually served the site — that caused 502s on
      // /os/calendar and /os/kanban, whose real pages live under /ops/.)
      fallback: [
        {
          source: "/os",
          destination: "/ops",
        },
        {
          source: "/os/:path*",
          destination: "/ops/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
