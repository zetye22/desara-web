/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output diperlukan untuk deploy di Hostinger Node.js
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      // Supabase Storage — untuk foto portfolio dari database
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
}

export default nextConfig
