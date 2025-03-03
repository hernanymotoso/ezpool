import { createTRPCRouter } from '@/server/api/trpc'
import { readPool } from './read'

export const poolRouter = createTRPCRouter({
  read: readPool,
})
