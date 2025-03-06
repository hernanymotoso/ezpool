import { env } from '@/env'
import { api } from '@/trpc/react'

type PoolsParams = {
  perPage?: number
  page?: number
}

export function usePools(params?: PoolsParams) {
  return api.solana.pool.read.useQuery({
    publicKey: env.frontend.WHIRLPOOL_CONFIG_PUBLIC_KEY,
    perPage: params?.perPage,
    page: params?.page,
  })
}
