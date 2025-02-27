'use client'

import { getEzpoolProgram, getEzpoolProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

export function useEzpoolProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(
    () => getEzpoolProgramId(cluster.network as Cluster),
    [cluster],
  )
  const program = useMemo(
    () => getEzpoolProgram(provider, programId),
    [provider, programId],
  )

  const accounts = useQuery({
    queryKey: ['ezpool', 'all', { cluster }],
    queryFn: async () => await program.account.ezpool.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: async () => await connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['ezpool', 'initialize', { cluster }],
    mutationFn: async (keypair: Keypair) =>
      await program.methods
        .initialize()
        .accounts({ ezpool: keypair.publicKey })
        .signers([keypair])
        .rpc(),
    onSuccess: async signature => {
      transactionToast(signature)
      return await accounts.refetch()
    },
    onError: () => toast.error('Failed to initialize account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

export function useEzpoolProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useEzpoolProgram()

  const accountQuery = useQuery({
    queryKey: ['ezpool', 'fetch', { cluster, account }],
    queryFn: async () => await program.account.ezpool.fetch(account),
  })

  const closeMutation = useMutation({
    mutationKey: ['ezpool', 'close', { cluster, account }],
    mutationFn: async () =>
      await program.methods.close().accounts({ ezpool: account }).rpc(),
    onSuccess: async tx => {
      transactionToast(tx)
      return await accounts.refetch()
    },
  })

  const decrementMutation = useMutation({
    mutationKey: ['ezpool', 'decrement', { cluster, account }],
    mutationFn: async () =>
      await program.methods.decrement().accounts({ ezpool: account }).rpc(),
    onSuccess: async tx => {
      transactionToast(tx)
      return await accountQuery.refetch()
    },
  })

  const incrementMutation = useMutation({
    mutationKey: ['ezpool', 'increment', { cluster, account }],
    mutationFn: async () =>
      await program.methods.increment().accounts({ ezpool: account }).rpc(),
    onSuccess: async tx => {
      transactionToast(tx)
      return await accountQuery.refetch()
    },
  })

  const setMutation = useMutation({
    mutationKey: ['ezpool', 'set', { cluster, account }],
    mutationFn: async (value: number) =>
      await program.methods.set(value).accounts({ ezpool: account }).rpc(),
    onSuccess: async tx => {
      transactionToast(tx)
      return await accountQuery.refetch()
    },
  })

  return {
    accountQuery,
    closeMutation,
    decrementMutation,
    incrementMutation,
    setMutation,
  }
}
