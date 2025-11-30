import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Prisma Client is included in the build
  serverExternalPackages: ["@prisma/client"],
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/.prisma/client/**"],
  },
};

export default nextConfig;
