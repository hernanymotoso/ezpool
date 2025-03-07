import { api } from '@/trpc/react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useMutation } from '@tanstack/react-query'
import { CreatePoolDTO, RequestThis } from './types'
import { Transaction } from '@solana/web3.js'

async function request(this: RequestThis, dto: Omit<CreatePoolDTO, 'account'>) {
  const { serializedTransaction } = await this.createPool({
    ...dto,
    account: this.userWallerPublicKey.toString(),
  })

  const decodedTransaction = Transaction.from(
    Buffer.from(serializedTransaction, 'base64'),
  )

  decodedTransaction.feePayer = this.userWallerPublicKey

  if (!this.signTransaction) throw new Error('Wallet not connected')

  const signature = await this.signTransaction(decodedTransaction)

  const tx = await this.connection.sendRawTransaction(signature.serialize())

  console.log('Yo', tx)
  return tx
}

export function useCreatePool() {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()

  if (!publicKey || !signTransaction || !connection)
    throw new Error('Wallet not connected')

  const { mutateAsync: createPool } = api.solana.pool.createPool.useMutation()

  return useMutation({
    mutationKey: ['whirlpool', 'create-pool'],
    mutationFn: request.bind({
      createPool,
      userWallerPublicKey: publicKey,
      signTransaction,
      connection,
    }),
    onSuccess(data) {
      console.log('Create pool data:', data)
    },
    onError(error) {
      console.error('Create pool error:', error)
    },
  })
}
