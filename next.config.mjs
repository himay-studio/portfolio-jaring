/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export supaya bisa dideploy ke Cloudflare Pages (R26).
  output: 'export',
  // Trailing slash membuat setiap rute jadi folder berisi index.html, jadi
  // /app/deals/ resolve tanpa perlu rewrite di sisi host statis (R59).
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
};

export default nextConfig;
