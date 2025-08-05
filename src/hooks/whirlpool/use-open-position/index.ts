import { api } from '@/trpc/react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useMutation } from '@tanstack/react-query'
import { OpenPositionDTO, RequestThis } from './types'
import { Transaction } from '@solana/web3.js'

async function request(
  this: RequestThis,
  dto: Omit<OpenPositionDTO, 'account'>,
) {
  const { serializedTransaction } = await this.openPosition({
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

export function useOpenPosition() {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()

  if (!publicKey || !signTransaction || !connection)
    throw new Error('Wallet not connected')

  const { mutateAsync: openPosition } =
    api.solana.pool.openPosition.useMutation()

  return useMutation({
    mutationKey: ['whirlpool', 'open-position'],
    mutationFn: request.bind({
      openPosition: openPosition as (
        dto: OpenPositionDTO,
      ) => Promise<{ serializedTransaction: string }>,
      userWallerPublicKey: publicKey,
      signTransaction,
      connection,
    }),
    onSuccess(data) {
      console.log('Open position data:', data)
    },
    onError(error) {
      console.error('Open position error:', error)
    },
  })
}
