import { useCluster } from '@/components/cluster/cluster-data-access'
import { useAnchorProvider } from '@/components/solana/solana-provider'
import { getWhirlpoolProgram, getWhirlpoolProgramId } from '@project/anchor'
import { Cluster } from '@solana/web3.js'
import { useMemo } from 'react'

export function useProgram() {
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

  return {
    program,
    programId,
    cluster,
  }
}
