import { api } from '@/trpc/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useMutation } from '@tanstack/react-query'
import { CreateFeeTierDTO, RequestThis } from './types'

async function request(
  this: RequestThis,
  dto: Omit<CreateFeeTierDTO, 'account'>,
) {
  const tx = await this.createFeeTier({
    ...dto,
    account: this.userWallerPublicKey?.toString() || '',
  })

  console.log('Yo', tx)
  return tx
}

export function useCreateFeeTier() {
  const { publicKey, signTransaction } = useWallet()

  const { mutateAsync: createFeeTier } =
    api.solana.pool.config.createFeeTier.useMutation()

  return useMutation({
    mutationKey: ['whirlpool', 'create-fee-tier'],
    mutationFn: request.bind({
      createFeeTier,
      userWallerPublicKey: publicKey!,
      signTransaction,
    }),
    onSuccess(data) {
      console.log('Create fee tier data:', data)
    },
    onError(error) {
      console.error('Create fee tier error:', error)
    },
  })
}
