import { env } from '@/env'
import { publicProcedure } from '@/server/api/trpc'
import { ResourceNotFoundError } from '@/utils/errors'
import { RequiredFieldError } from '@/utils/errors/required-field-error'
import { PriceMath } from '@/utils/math/price-math'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Whirlpool, WHIRLPOOL_PROGRAM_ID, WhirlpoolIDL } from '@project/anchor'
import { AnchorWallet } from '@solana/wallet-adapter-react'
import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from '@solana/web3.js'
import Decimal from 'decimal.js'
import { z } from 'zod'
import { getKeypairFromSecretKey } from '../helpers'
import {
  buildFeeTierPDA,
  buildPoolPDA,
  buildTokenBadgePDA,
  getTokenInfo,
} from './helpers'

export const createPool = publicProcedure
  .input(
    z.object({
      account: z.string().nonempty({ message: 'Connect your wallet!' }),
      tokenMintA: z.string().nonempty({ message: 'Token mint A is required!' }),
      tokenMintB: z.string().nonempty({ message: 'Token mint B is required!' }),
      tickSpacing: z
        .number()
        .min(1, { message: 'Tick spacing must be greater than 0' }),
      initialPrice: z.number().optional().default(1),
    }),
  )
  .mutation(async ({ input }) => {
    if (!input?.account) throw new RequiredFieldError('Account')

    const { account, tokenMintA, tokenMintB, tickSpacing, initialPrice } = input

    const connection = new Connection(clusterApiUrl('devnet'))
    const sender = new PublicKey(account)

    const dummyWallet = {
      publicKey: sender,
      signTransaction: () => {
        throw new Error('Not implemented')
      },
      signAllTransactions: () => {
        throw new Error('Not implemented')
      },
    }

    const provider = new AnchorProvider(
      connection,
      dummyWallet as unknown as AnchorWallet,
      { commitment: 'confirmed', skipPreflight: true },
    )

    const program = new Program(
      WhirlpoolIDL as Whirlpool,
      WHIRLPOOL_PROGRAM_ID,
      provider,
    )

    const feeTierPDA = buildFeeTierPDA(tickSpacing, program.programId)
    const feeTierAccount = await program.account.feeTier.fetch(feeTierPDA)
    if (!feeTierAccount?.tickSpacing) throw new ResourceNotFoundError('FeeTier')

    const poolPDA = buildPoolPDA({
      tokenMintA,
      tokenMintB,
      tickSpacing: feeTierAccount.tickSpacing,
      programId: program.programId,
    })

    const tokenBadgeA = buildTokenBadgePDA(tokenMintA, program.programId)
    const tokenBadgeB = buildTokenBadgePDA(tokenMintB, program.programId)

    const tokenInfoA = await getTokenInfo({
      connection,
      tokenMint: tokenMintA,
    })
    const tokenInfoB = await getTokenInfo({
      connection,
      tokenMint: tokenMintA,
    })

    const initialSqrtPrice = PriceMath.priceToSqrtPriceX64(
      new Decimal(initialPrice || 1),
      tokenInfoA.decimals,
      tokenInfoB.decimals,
    )

    const funderKeypair = getKeypairFromSecretKey(
      env.server.FUNDER_WALLET_SECRET_KEY,
    )

    const tokenVaultKeypair = Keypair.generate()
    const tokenVaultBKeypair = Keypair.generate()

    const context = {
      tokenMintA: new PublicKey(tokenMintA),
      tokenMintB: new PublicKey(tokenMintB),
      tokenVaultA: tokenVaultKeypair.publicKey,
      tokenVaultB: tokenVaultBKeypair.publicKey,
      tokenBadgeA,
      tokenBadgeB,
      tokenProgramA: tokenInfoA.tokenProgram,
      tokenProgramB: tokenInfoB.tokenProgram,
      feeTier: feeTierPDA,
      whirlpool: poolPDA,
      whirlpoolsConfig: env.server.CONFIG_WALLET_PUBLIC_KEY,
      funder: funderKeypair.publicKey,
      rent: SYSVAR_RENT_PUBKEY,
      systemProgram: SystemProgram.programId,
    }

    console.log('context\n', context)

    const instruction = await program.methods
      .initializePoolV2(tickSpacing, initialSqrtPrice)
      .accounts(context)
      .signers([funderKeypair, tokenVaultKeypair, tokenVaultBKeypair])
      .instruction()

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash()

    const transaction = new Transaction({
      feePayer: sender,
      blockhash,
      lastValidBlockHeight,
    }).add(instruction)

    transaction.partialSign(
      funderKeypair,
      tokenVaultKeypair,
      tokenVaultBKeypair,
    )
    const serializedTransaction = transaction
      .serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      })
      .toString('base64')

    console.log('serializedTransaction\n', serializedTransaction)

    return {
      serializedTransaction,
    }
  })
