import { createTRPCRouter } from '@/server/api/trpc'
import { createFeeTier } from './pool-config/create-fee-tier'

export const configRouter = createTRPCRouter({
  createFeeTier,
})
