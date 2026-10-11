import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
  })

// Retener la instancia en globalThis para reutilizar conexiones PgBouncer en Vercel
globalForPrisma.prisma = prisma
