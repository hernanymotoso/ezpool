import { NextRequest } from 'next/server'
import { env } from '@/env'
import { createTRPCContext } from '@/server/api/trpc'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/server/api/root'

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  return await createTRPCContext({
    headers: req.headers,
  })
}

const handler = async (req: NextRequest) =>
  await fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => await createContext(req),
    onError:
      env.server.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`,
            )
          }
        : undefined,
  })

export { handler as GET, handler as POST }
