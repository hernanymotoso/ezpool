import { createTRPCRouter } from '@/server/api/trpc'
import { createFeeTier } from './create-fee-tier'

export const configRouter = createTRPCRouter({
  createFeeTier,
})
