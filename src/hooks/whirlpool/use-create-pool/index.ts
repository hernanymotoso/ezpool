import { ResourceNotFoundError } from '@/utils/errors'
import { PriceMath } from '@/utils/math/price-math'
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
import {
  buildPoolPDA,
  buildTokenBadgePDA,
  getFunderKeypair,
  getTokenInfo,
} from './helpers'
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

  const tokenBadgeA = buildTokenBadgePDA(dto.tokenMintA, this.program.programId)
  const tokenBadgeB = buildTokenBadgePDA(dto.tokenMintB, this.program.programId)

  const tokenInfoA = await getTokenInfo({
    connection: this.connection,
    tokenMint: dto.tokenMintA,
  })
  const tokenInfoB = await getTokenInfo({
    connection: this.connection,
    tokenMint: dto.tokenMintA,
  })

  const initialSqrtPrice = PriceMath.priceToSqrtPriceX64(
    new Decimal(dto?.initialPrice || 1),
    tokenInfoA.decimals,
    tokenInfoB.decimals,
  )

  const context = {
    tokenMintA: new PublicKey(dto.tokenMintA),
    tokenMintB: new PublicKey(dto.tokenMintB),
    tokenVaultA: tokenVaultAKeypair.publicKey,
    tokenVaultB: tokenVaultBKeypair.publicKey,
    tokenBadgeA,
    tokenBadgeB,
    tokenProgramA: tokenInfoA.tokenProgram,
    tokenProgramB: tokenInfoB.tokenProgram,
    feeTier: feeTier.feeTierPDA,
    whirlpool: poolPDA,
    whirlpoolsConfig: WHIRLPOOL_CONFIG,
    funder: funderKeypair.publicKey,
    rent: SYSVAR_RENT_PUBKEY,
    systemProgram: SystemProgram.programId,
  }

  const txSignature = await this.program.methods
    .initializePoolV2(dto.tickSpacing, initialSqrtPrice)
    .accounts(context)
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
