/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Optimizaciones para filesystem lento
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  // Deshabilitar el cache de TypeScript durante desarrollo si es muy lento
  swcMinify: true,
  // Optimizar experimental features si es necesario
  experimental: {
    optimizePackageImports: ["@supabase/ssr"],
  },
};

export default nextConfig;
