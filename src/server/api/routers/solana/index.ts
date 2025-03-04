import { createTRPCRouter } from '../../trpc'
import { configRouter } from './config'
import { poolRouter } from './pool'

export const solanaRouter = createTRPCRouter({
  config: configRouter,
  pool: poolRouter,
})
