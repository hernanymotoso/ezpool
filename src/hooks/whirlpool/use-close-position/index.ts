import { api } from '@/trpc/react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction } from '@solana/web3.js'
import { useMutation } from '@tanstack/react-query'
import { ClosePositionDTO, RequestThis } from './types'

async function request(
  this: RequestThis,
  dto: Omit<ClosePositionDTO, 'account'>,
) {
  const { serializedTransaction } = await this.closePosition({
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

export function useClosePosition() {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()

  if (!publicKey || !signTransaction || !connection)
    throw new Error('Wallet not connected')

  const { mutateAsync: closePosition } =
    api.solana.pool.closePosition.useMutation()

  return useMutation({
    mutationKey: ['whirlpool', 'close-position'],
    mutationFn: request.bind({
      closePosition,
      userWallerPublicKey: publicKey,
      signTransaction,
      connection,
    }),
    onSuccess(data) {
      console.log('Close position data:', data)
    },
    onError(error) {
      console.error('Close position error:', error)
    },
  })
}
