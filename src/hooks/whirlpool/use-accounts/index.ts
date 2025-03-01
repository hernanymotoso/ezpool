import { useCluster } from '@/components/cluster/cluster-data-access'
import { AccountType } from './types'
import { useAnchorProvider } from '@/components/solana/solana-provider'
import { useMemo } from 'react'
import { getWhirlpoolProgram, getWhirlpoolProgramId } from '@project/anchor'
import { Cluster } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'

export function useAccounts(type: AccountType) {
  const { cluster } = useCluster()
  const provider = useAnchorProvider()

  const programId = useMemo(
    () => getWhirlpoolProgramId(cluster.network as Cluster),
    [cluster],
  )

  const program = useMemo(
    () => getWhirlpoolProgram(provider, programId),
    [provider, programId],
  )

  const isValidType = type && program.account?.[type]

  return useQuery({
    queryKey: ['ezpool', 'accounts', type, { cluster }],
    queryFn: async () => {
      if (!isValidType) {
        throw new Error(
          `Invalid account type "${type}". Ensure it exists in the program.`,
        )
      }
      return await program.account[type].all()
    },
    enabled: Boolean(type),
  })
}
