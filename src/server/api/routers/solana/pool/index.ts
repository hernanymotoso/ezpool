import { createTRPCRouter } from '@/server/api/trpc'
import { readPool } from './read'
import { createPool } from './create-pool'

export const poolRouter = createTRPCRouter({
  read: readPool,
  createPool,
})
