import { api } from '@/trpc/react'
import { useWallet } from '@solana/wallet-adapter-react'

type FeeTiersParams = {
  perPage?: number
  page?: number
}

export function useFeeTiers(params?: FeeTiersParams) {
  const { publicKey } = useWallet()

  return api.solana.pool.config.fetchFeeTiers.useQuery({
    account: publicKey?.toString() || '',
    perPage: params?.perPage,
    page: params?.page,
  })
}
