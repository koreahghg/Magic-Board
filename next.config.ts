import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma Client는 Node.js native bindings를 사용하므로 서버 번들에서 제외
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
