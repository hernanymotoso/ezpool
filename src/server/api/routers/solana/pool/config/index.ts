import { createTRPCRouter } from '@/server/api/trpc'
import { createFeeTier } from './create-fee-tier'
import { fetchFeeTiers } from './fetch-fee-tiers'

export const configRouter = createTRPCRouter({
  createFeeTier,
  fetchFeeTiers,
})
