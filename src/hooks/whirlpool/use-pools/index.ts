import { api } from '@/trpc/react'
import { useWallet } from '@solana/wallet-adapter-react'

type PoolsParams = {
  perPage?: number
  page?: number
}

export function usePools(params?: PoolsParams) {
  const { publicKey } = useWallet()
  if (!publicKey) throw new Error('Connect your wallet!')

  return api.solana.pool.read.useQuery({
    account: publicKey.toString(),
    perPage: params?.perPage,
    page: params?.page,
  })
}
