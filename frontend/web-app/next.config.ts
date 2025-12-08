import type { NextConfig } from "next";

const allowLocalUploads = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  images: {
    // Allow loading images from the local backend during development
    dangerouslyAllowLocalIP: allowLocalUploads,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i8.amplience.net",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "files.stripe.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "dailypost.ng",
      },
      // Allow local backend-served uploads for development
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "3000",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
