// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error(
    "❌ DATABASE_URL environment variable is not set. Please create a .env file with your database connection string."
  );
}

// Prisma Client configuration optimized for serverless/production
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    // Connection pool configuration for serverless environments
    // If using connection pooling (e.g., PgBouncer, Prisma Data Proxy), 
    // the connection_limit and pool_timeout are handled by the connection string
  });

// In production, we still want to reuse the same instance to avoid connection exhaustion
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
} else {
  // In production, ensure we're using the same instance
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prisma;
  }
}
