import { createTRPCRouter } from '@/server/api/trpc'
import { readPool } from './read'
import { createPool } from './create-pool'
import { configRouter } from './config'
import { openPosition } from './open-position'
import { fetchPositions } from './fetch-positions'

export const poolRouter = createTRPCRouter({
  config: configRouter,
  read: readPool,
  createPool,
  openPosition,
  fetchPositions,
})
