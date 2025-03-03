import { api } from '@/trpc/react'

type PoolsParams = {
  perPage?: number
  page?: number
}

export function usePools(params?: PoolsParams) {
  const whirlpoolConfigAddress = process.env.NEXT_PUBLIC_CONFIG_ADDRESS!
  return api.solana.pool.read.useQuery({
    publicKey: whirlpoolConfigAddress,
    perPage: params?.perPage,
    page: params?.page,
  })
}
