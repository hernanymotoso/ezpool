import { ResourceNotFoundError } from '@/utils/errors'
import { PriceMath } from '@/utils/math/price-math'
import { getMint } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js'
import { useMutation } from '@tanstack/react-query'
import Decimal from 'decimal.js'
import { useFeeTier } from '../use-fee-tier'
import { useProgram } from '../use-program'
import { buildPoolPDA, buildTokenBadgePDA, getFunderKeypair } from './helpers'
import { CreatePoolDTO, RequestThis } from './types'

const WHIRLPOOL_CONFIG = process.env.NEXT_PUBLIC_CONFIG_ADDRESS!

async function request(this: RequestThis, dto: CreatePoolDTO) {
  const funderKeypair = getFunderKeypair()

  const feeTier = await this.getFeeTier({ tickSpacing: dto.tickSpacing })
  if (!feeTier?.feeTierAccount) throw new ResourceNotFoundError('FeeTier')

  const poolPDA = buildPoolPDA({
    tokenMintA: dto.tokenMintA,
    tokenMintB: dto.tokenMintB,
    tickSpacing: feeTier.feeTierAccount.tickSpacing,
    programId: this.program.programId,
  })

  // TODO: How's work the token vaults
  const tokenVaultAKeypair = Keypair.generate()
  const tokenVaultBKeypair = Keypair.generate()

  // token badge PDAs
  const tokenBadgeA = buildTokenBadgePDA(dto.tokenMintA, this.program.programId)
  const tokenBadgeB = buildTokenBadgePDA(dto.tokenMintB, this.program.programId)

  const tokenInfoA = await this.connection.getAccountInfo(
    new PublicKey(dto.tokenMintA),
  )

  // tx ernV2GcQCX2anoL7YRc2hExMnWqUzGZ6NEgVXChT1zN2SXi24rYa4wdaXACS9JcAH1zuCYNZnuNCsWX2GT1oYJi

  if (!tokenInfoA?.owner) throw new ResourceNotFoundError('TokenProgramA')
  const mintInfoA = await getMint(
    this.connection,
    new PublicKey(dto.tokenMintA),
  )

  const tokenInfoB = await this.connection.getAccountInfo(
    new PublicKey(dto.tokenMintB),
  )
  if (!tokenInfoB?.owner) throw new ResourceNotFoundError('TokenProgramB')
  const mintInfoB = await getMint(
    this.connection,
    new PublicKey(dto.tokenMintB),
  )

  const initialSqrtPrice = PriceMath.priceToSqrtPriceX64(
    new Decimal(dto?.initialPrice || 1),
    mintInfoA.decimals,
    mintInfoB.decimals,
  )

  const txSignature = await this.program.methods
    .initializePoolV2(dto.tickSpacing, initialSqrtPrice)
    .accounts({
      tokenMintA: new PublicKey(dto.tokenMintA),
      tokenMintB: new PublicKey(dto.tokenMintB),
      tokenVaultA: tokenVaultAKeypair.publicKey,
      tokenVaultB: tokenVaultBKeypair.publicKey,
      tokenBadgeA,
      tokenBadgeB,
      tokenProgramA: tokenInfoA.owner.toBase58(),
      tokenProgramB: tokenInfoB.owner.toBase58(),
      feeTier: feeTier.feeTierPDA,
      whirlpool: poolPDA,
      whirlpoolsConfig: WHIRLPOOL_CONFIG,
      funder: funderKeypair.publicKey,
      rent: SYSVAR_RENT_PUBKEY,
      systemProgram: SystemProgram.programId,
    })
    .signers([funderKeypair, tokenVaultAKeypair, tokenVaultBKeypair])
    .rpc()

  return txSignature
}

export function useCreatePool() {
  const { cluster, program } = useProgram()
  const { connection } = useConnection()
  const { publicKey: userWalletPublicKey } = useWallet()

  if (!connection || !userWalletPublicKey)
    throw new Error('Connect your wallet')

  const { mutateAsync: getFeeTier } = useFeeTier()
  return useMutation({
    mutationKey: ['whirlpool', 'create-pool', { cluster }],
    mutationFn: request.bind({
      program,
      getFeeTier,
      connection,
      userWalletPublicKey,
    }),
    onSuccess(data) {
      console.log('Create pool data:', data)
    },
    onError(error) {
      console.error('Create pool error:', error)
    },
  })
}
