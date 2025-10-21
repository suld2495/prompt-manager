import { PrismaClient } from '@prisma/client'

const getPrismaClient = () => {
  const databaseUrl = process.env.DATABASE_URL
  let datasourceUrl: string | undefined

  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl)
      // pgBouncer 환경에서는 prepared statement를 비활성화해야 함
      if (!url.searchParams.has('pgbouncer')) {
        url.searchParams.set('pgbouncer', 'true')
      }
      datasourceUrl = url.toString()
    } catch {
      datasourceUrl = databaseUrl
    }
  }

  return new PrismaClient(
    datasourceUrl
      ? {
          datasources: {
            db: {
              url: datasourceUrl,
            },
          },
        }
      : undefined,
  )
}

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof getPrismaClient>
}

export const prisma = globalThis.prismaGlobal ?? getPrismaClient()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
