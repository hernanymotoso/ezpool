'use client'

import { getWhirlpoolProgram, getWhirlpoolProgramId } from '@project/anchor'
import { Cluster } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'

export function useWhirlpoolProgram() {
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

  const accounts = useQuery({
    queryKey: ['whirlpool', 'all', { cluster }],
    queryFn: async () => await program.account.whirlpool.all(),
  })

  return {
    program,
    programId,
    accounts,
  }
}
