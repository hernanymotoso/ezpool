import { publicProcedure } from '@/server/api/trpc'
import { ResourceNotFoundError } from '@/utils/errors'
import { RequiredFieldError } from '@/utils/errors/required-field-error'
import { PriceMath } from '@/utils/math/price-math'
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token'
import {
  ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
  findAssociatedTokenPda,
} from '@solana-program/token-2022'
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import Decimal from 'decimal.js'
import { z } from 'zod'
import { getTokenInfo } from '../create-pool/helpers'
import {
  buildPositionPDA,
  buildTickArrayPDA,
  fetchAllMaybeTickArray,
  getInitializableTickIndex,
  getTickArrayStartTickIndex,
  increaseLiquidityQuote,
  orderTickIndexes,
  TICK_ARRAY_SIZE,
} from './helpers'
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token'

const MIN_TICK_INDEX = -443636
const MAX_TICK_INDEX = 443636

export const openPosition = publicProcedure
  .input(
    z.object({
      account: z.string().nonempty({ message: 'Connect your wallet!' }),
      poolAddress: z
        .string()
        .nonempty({ message: 'Pool address is required!' }),
      lowerPrice: z.number().optional().default(MIN_TICK_INDEX),
      upperPrice: z.number().optional().default(MAX_TICK_INDEX),
      liquidity: z.bigint().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    if (!input.account) throw new RequiredFieldError('Account')
    if (!input.poolAddress) throw new RequiredFieldError('Pool address')
    const { account, poolAddress } = input
    const { program, connection } = ctx.solana(account)

    const positionMint = Keypair.generate()
    const pool = await program.account.whirlpool.fetch(poolAddress)
    if (!pool) throw new ResourceNotFoundError('Pool')

    const tokenInfoA = await getTokenInfo({
      connection,
      tokenMint: pool.tokenMintA.toString(),
    })
    const tokenInfoB = await getTokenInfo({
      connection,
      tokenMint: pool.tokenMintB.toString(),
    })
    const decimalsA = tokenInfoA.decimals
    const decimalsB = tokenInfoB.decimals

    const lowerTickIndex = PriceMath.priceToTickIndex(
      new Decimal(input.lowerPrice),
      decimalsA,
      decimalsB,
    )
    const upperTickIndex = PriceMath.priceToTickIndex(
      new Decimal(input.upperPrice),
      decimalsA,
      decimalsB,
    )

    // First get initializable ticks
    const initializableLowerTickIndex = getInitializableTickIndex(
      lowerTickIndex,
      pool.tickSpacing,
      false,
    )
    const initializableUpperTickIndex = getInitializableTickIndex(
      upperTickIndex,
      pool.tickSpacing,
      true,
    )

    // Then order them
    const tickRange = orderTickIndexes(
      initializableLowerTickIndex,
      initializableUpperTickIndex,
    )

    const lowerTickArrayIndex = getTickArrayStartTickIndex(
      tickRange.lowerTickIndex,
      pool.tickSpacing,
    )
    const upperTickArrayIndex = getTickArrayStartTickIndex(
      tickRange.upperTickIndex,
      pool.tickSpacing,
    )

    console.log('Lower tick array start index:', lowerTickArrayIndex)
    console.log('Upper tick array start index:', upperTickArrayIndex)

    if (lowerTickArrayIndex % (TICK_ARRAY_SIZE * pool.tickSpacing) !== 0) {
      throw new Error('Invalid lower tick array start index')
    }
    if (upperTickArrayIndex % (TICK_ARRAY_SIZE * pool.tickSpacing) !== 0) {
      throw new Error('Invalid upper tick array start index')
    }

    const { positionBump, positionPDA } = buildPositionPDA(
      positionMint.publicKey,
      program.programId,
    )

    const [positionTokenAccountPDA] = await findAssociatedTokenPda({
      owner: account.toString() as any,
      mint: positionMint.publicKey.toString() as any,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    })
    const lowerTickArrayPDA = buildTickArrayPDA(
      new PublicKey(poolAddress),
      lowerTickArrayIndex,
      program.programId,
    )
    const upperTickArrayPDA = buildTickArrayPDA(
      new PublicKey(poolAddress),
      upperTickArrayIndex,
      program.programId,
    )

    const [lowerTickArray, upperTickArray] = await fetchAllMaybeTickArray(
      connection,
      [lowerTickArrayPDA, upperTickArrayPDA],
    )

    const instructions: TransactionInstruction[] = []

    if (!lowerTickArray) {
      instructions.push(
        await program.methods
          .initializeTickArray(lowerTickArrayIndex)
          .accounts({
            whirlpool: new PublicKey(poolAddress),
            tickArray: lowerTickArrayPDA,
            funder: account,
          })
          .instruction(),
      )
    }

    if (!upperTickArray && lowerTickArrayIndex !== upperTickArrayIndex) {
      instructions.push(
        await program.methods
          .initializeTickArray(upperTickArrayIndex)
          .accounts({
            whirlpool: new PublicKey(poolAddress),
            tickArray: upperTickArrayPDA,
            funder: account,
          })
          .instruction(),
      )
    }

    instructions.push(
      await program.methods
        .openPosition(
          { positionBump },
          tickRange.lowerTickIndex,
          tickRange.upperTickIndex,
        )
        .accounts({
          funder: account,
          owner: account,
          position: positionPDA,
          positionMint: positionMint.publicKey,
          positionTokenAccount: positionTokenAccountPDA,
          whirlpool: new PublicKey(poolAddress),
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
        })
        .signers([positionMint])
        .instruction(),
    )

    if (input.liquidity) {
      console.log('Pool token mints:', {
        tokenMintA: pool.tokenMintA.toString(),
        tokenMintB: pool.tokenMintB.toString(),
      })

      const tokenMintA = await getTokenInfo({
        connection,
        tokenMint: pool.tokenMintA.toString(),
      })
      const [tokenOwnerAccountA] = await findAssociatedTokenPda({
        owner: account.toString() as any,
        mint: pool.tokenMintA.toString() as any,
        tokenProgram: tokenMintA.tokenProgram as any,
      })

      const ataInfoA = await connection.getAccountInfo(
        new PublicKey(tokenOwnerAccountA),
      )

      if (!ataInfoA) {
        instructions.push(
          createAssociatedTokenAccountInstruction(
            new PublicKey(account), // payer
            new PublicKey(tokenOwnerAccountA), // ata
            new PublicKey(account), // owner
            new PublicKey(pool.tokenMintA), // mint
          ),
        )
      }

      const tokenMintB = await getTokenInfo({
        connection,
        tokenMint: pool.tokenMintB.toString(),
      })
      const [tokenOwnerAccountB] = await findAssociatedTokenPda({
        owner: account.toString() as any,
        mint: pool.tokenMintB.toString() as any,
        tokenProgram: tokenMintB.tokenProgram as any,
      })

      const ataInfoB = await connection.getAccountInfo(
        new PublicKey(tokenOwnerAccountB),
      )

      if (!ataInfoB) {
        instructions.push(
          createAssociatedTokenAccountInstruction(
            new PublicKey(account), // payer
            new PublicKey(tokenOwnerAccountB), // ata
            new PublicKey(account), // owner
            new PublicKey(pool.tokenMintB), // mint
          ),
        )
      }

      // Log the derived ATAs
      console.log('Derived token accounts:', {
        tokenOwnerAccountA: tokenOwnerAccountA.toString(),
        tokenOwnerAccountB: tokenOwnerAccountB.toString(),
        userWallet: account.toString(),
      })

      const [balanceA, balanceB] = await Promise.all([
        connection.getTokenAccountBalance(new PublicKey(tokenOwnerAccountA)),
        connection.getTokenAccountBalance(new PublicKey(tokenOwnerAccountB)),
      ])

      console.log('Available balances:', {
        tokenA: balanceA.value.amount,
        tokenB: balanceB.value.amount,
      })

      const quote = increaseLiquidityQuote({
        liquidityDelta: input.liquidity,
        slippageToleranceBps: 1000, // 1% slippage
        currentSqrtPrice: new Decimal(pool.sqrtPrice.toString()),
        tickIndex1: tickRange.lowerTickIndex,
        tickIndex2: tickRange.upperTickIndex,
      })

      console.log('Quote:', {
        liquidityAmount: quote.liquidityAmount.toString(),
        tokenMaxA: quote.tokenMaxA.toString(),
        tokenMaxB: quote.tokenMaxB.toString(),
      })

      instructions.push(
        await program.methods
          .increaseLiquidity(
            quote.liquidityAmount,
            quote.tokenMaxA,
            quote.tokenMaxB,
          )
          .accounts({
            whirlpool: new PublicKey(poolAddress),
            positionAuthority: account,
            position: positionPDA,
            positionTokenAccount: positionTokenAccountPDA,
            tokenOwnerAccountA,
            tokenOwnerAccountB,
            tokenVaultA: pool.tokenVaultA,
            tokenVaultB: pool.tokenVaultB,
            tickArrayLower: lowerTickArrayPDA,
            tickArrayUpper: upperTickArrayPDA,
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
          })
          .instruction(),
      )
    }

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash()

    const transaction = new Transaction({
      feePayer: new PublicKey(account),
      blockhash,
      lastValidBlockHeight,
    }).add(...instructions)

    transaction.partialSign(positionMint)

    const serializedTransaction = transaction
      .serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      })
      .toString('base64')

    return {
      serializedTransaction,
    }
  })
