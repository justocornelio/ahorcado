import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    formats: ["image/avif", "image/webp"],
    // 👉 agrega dominios solo si usas imágenes externas
    domains: [
      // "images.unsplash.com",
      // "res.cloudinary.com",
    ],
  },

  // Mejora el SEO y rendimiento
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
