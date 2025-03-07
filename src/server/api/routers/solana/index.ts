import { createTRPCRouter } from '../../trpc'
import { poolRouter } from './pool'

export const solanaRouter = createTRPCRouter({
  pool: poolRouter,
})
