import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || 'file:db/custom.db'

  // If it's a libsql/turso URL (starts with libsql://), use the adapter
  if (dbUrl.startsWith('libsql://') || dbUrl.startsWith('file:')) {
    const libsql = createClient({ url: dbUrl, authToken: process.env.DATABASE_AUTH_TOKEN })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({ adapter, log: process.env.NODE_ENV !== 'production' ? ['query'] : [] })
  }

  // Fallback to default SQLite
  return new PrismaClient({ log: process.env.NODE_ENV !== 'production' ? ['query'] : [] })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db