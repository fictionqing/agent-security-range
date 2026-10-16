/** @type {import('next').NextConfig} */
const backendOrigin = (
  process.env.BACKEND_ORIGIN || "http://127.0.0.1:8801"
).replace(/\/$/, "");

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backendOrigin}/api/:path*` },
      { source: "/health", destination: `${backendOrigin}/health` },
      { source: "/docs", destination: `${backendOrigin}/docs` },
      { source: "/docs/:path*", destination: `${backendOrigin}/docs/:path*` },
      { source: "/openapi.json", destination: `${backendOrigin}/openapi.json` },
      { source: "/redoc", destination: `${backendOrigin}/redoc` },
    ];
  },
};

export default nextConfig;
