import { api } from '@/trpc/react'
import { useWallet } from '@solana/wallet-adapter-react'

export function useFetchPositions() {
  const { publicKey } = useWallet()
  if (!publicKey) throw new Error('Connect your wallet!')

  return api.solana.pool.fetchPositions.useQuery({
    account: publicKey.toString(),
  })
}
