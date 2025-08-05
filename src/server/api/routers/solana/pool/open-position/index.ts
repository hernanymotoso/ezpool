import { initializeWasm } from '@/lib/wasm/init'
import {
  get_initializable_tick_index,
  get_tick_array_start_tick_index,
  order_tick_indexes,
  price_to_tick_index,
} from '@/lib/wasm/pkg/orca_whirlpools_core'
import { publicProcedure } from '@/server/api/trpc'
import { ResourceNotFoundError } from '@/utils/errors'
import { RequiredFieldError } from '@/utils/errors/required-field-error'
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token'
import {
  ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
  findAssociatedTokenPda,
} from '@solana-program/token-2022'
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token'
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import { z } from 'zod'
import { getTokenInfo } from '../create-pool/helpers'
import {
  buildPositionPDA,
  buildTickArrayPDA,
  fetchAllMaybeTickArray,
  getIncreaseLiquidityQuote,
  TICK_ARRAY_SIZE,
} from './helpers'
import { BN } from 'bn.js'

const MIN_TICK_INDEX = 0.0000247524 // (-300000) MIN
const MAX_TICK_INDEX = 40400.9534 // (300000) MAX

export const openPosition = publicProcedure
  .input(
    z.object({
      account: z.string().nonempty({ message: 'Connect your wallet!' }),
      poolAddress: z
        .string()
        .nonempty({ message: 'Pool address is required!' }),
      lowerPrice: z.number().optional().default(MIN_TICK_INDEX),
      upperPrice: z.number().optional().default(MAX_TICK_INDEX),
      liquidity: z.bigint(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    try {
      await initializeWasm()

      if (!input.account) throw new RequiredFieldError('Account')
      if (!input.poolAddress) throw new RequiredFieldError('Pool address')
      const { account, poolAddress, liquidity, lowerPrice, upperPrice } = input
      const { program, connection } = ctx.solana(account)

      console.log('openPositionDTO', {
        account,
        poolAddress,
        liquidity: liquidity.toString(),
        lowerPrice,
        upperPrice,
      })

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

      console.log('tokens decimals', { decimalsA, decimalsB })

      if (input.lowerPrice <= 0) {
        throw new Error('Lower price must be greater than 0')
      }
      const lowerTickIndex = price_to_tick_index(
        input.lowerPrice,
        decimalsA,
        decimalsB,
      )

      if (input.lowerPrice <= 0) {
        throw new Error('Upper price must be greater than 0')
      }
      const upperTickIndex = price_to_tick_index(
        input.upperPrice,
        decimalsA,
        decimalsB,
      )

      // Then order them
      const tickRange = order_tick_indexes(lowerTickIndex, upperTickIndex)

      // First get initializable ticks
      const initializableLowerTickIndex = get_initializable_tick_index(
        tickRange.tickLowerIndex,
        pool.tickSpacing,
        false,
      )
      const initializableUpperTickIndex = get_initializable_tick_index(
        tickRange.tickUpperIndex,
        pool.tickSpacing,
        true,
      )

      const lowerTickArrayIndex = get_tick_array_start_tick_index(
        initializableLowerTickIndex,
        pool.tickSpacing,
      )
      const upperTickArrayIndex = get_tick_array_start_tick_index(
        initializableUpperTickIndex,
        pool.tickSpacing,
      )

      // After getting tick indices
      const tickSpacing = Number(pool.tickSpacing)
      const tickArraySize = TICK_ARRAY_SIZE * tickSpacing

      // Calculate start tick indices ensuring they are properly aligned
      const lowerStartTick =
        Math.floor(lowerTickIndex / tickArraySize) * tickArraySize
      const upperStartTick =
        Math.floor(upperTickIndex / tickArraySize) * tickArraySize

      // Validate tick array indices
      if (lowerStartTick !== lowerTickArrayIndex) {
        throw new Error(
          `Invalid lower tick array start index. Expected ${lowerStartTick}, got ${lowerTickArrayIndex}`,
        )
      }

      if (upperStartTick !== upperTickArrayIndex) {
        throw new Error(
          `Invalid upper tick array start index. Expected ${upperStartTick}, got ${upperTickArrayIndex}`,
        )
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

      const initializeTickArrayLowerParams = {
        lowerTickArrayIndex,
      }

      const initializeTickArrayLowerContext = {
        whirlpool: new PublicKey(poolAddress),
        tickArray: lowerTickArrayPDA,
        funder: account,
        systemProgram: SystemProgram.programId,
      }

      console.log('tick DATA', {
        lowerTickIndex,
        upperTickIndex,
        tickRange,
        initializableLowerTickIndex,
        initializableUpperTickIndex,
        lowerTickArrayIndex,
        upperTickArrayIndex,
      })

      // console.log({
      //   initializeTickArrayLowerParams,
      //   initializeTickArrayLowerContext,
      // })

      // Initialize lower tick array if needed
      if (!lowerTickArray) {
        try {
          instructions.push(
            await program.methods
              .initializeTickArray(
                initializeTickArrayLowerParams.lowerTickArrayIndex,
              )
              .accounts(initializeTickArrayLowerContext)
              .instruction(),
          )
          console.log(
            'Added instruction to initialize lower tick array:',
            lowerTickArrayIndex,
          )
        } catch (error) {
          console.error('Failed to create lower tick array instruction:', error)
          throw error
        }
      }

      const initializeTickArrayUpperParams = {
        upperTickArrayIndex,
      }
      const initializeTickArrayUpperContext = {
        whirlpool: new PublicKey(poolAddress),
        tickArray: upperTickArrayPDA,
        funder: account,
        systemProgram: SystemProgram.programId,
      }

      // console.log({
      //   initializeTickArrayUpperParams,
      //   initializeTickArrayUpperContext,
      // })

      // Initialize upper tick array if needed and different from lower
      if (!upperTickArray && lowerTickArrayIndex !== upperTickArrayIndex) {
        try {
          instructions.push(
            await program.methods
              .initializeTickArray(
                initializeTickArrayUpperParams.upperTickArrayIndex,
              )
              .accounts(initializeTickArrayUpperContext)
              .instruction(),
          )
          console.log(
            'Added instruction to initialize upper tick array:',
            upperTickArrayIndex,
          )
        } catch (error) {
          console.error('Failed to create upper tick array instruction:', error)
          throw error
        }
      }

      // Validate that tick arrays are properly initialized or will be initialized
      if (!lowerTickArray && instructions.length === 0) {
        throw new Error(
          'Lower tick array needs initialization but no instruction was added',
        )
      }

      if (
        !upperTickArray &&
        lowerStartTick !== upperStartTick &&
        instructions.length < 2
      ) {
        throw new Error(
          'Upper tick array needs initialization but no instruction was added',
        )
      }

      const openPositionParams = {
        positionBump,
        initializableLowerTickIndex,
        initializableUpperTickIndex,
      }

      const openPositionContext = {
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
      }

      // console.log('openPosition instructionDATA', {
      //   openPositionParams,
      //   openPositionContext,
      // })

      instructions.push(
        await program.methods
          .openPosition(
            { positionBump },
            initializableLowerTickIndex,
            initializableUpperTickIndex,
          )
          .accounts(openPositionContext)
          .signers([positionMint])
          .instruction(),
      )

      if (input.liquidity) {
        // console.log('Pool token mints:', {
        //   tokenMintA: pool.tokenMintA.toString(),
        //   tokenMintB: pool.tokenMintB.toString(),
        // })

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

        // // Log the derived ATAs
        // console.log('Derived token accounts:', {
        //   tokenOwnerAccountA: tokenOwnerAccountA.toString(),
        //   tokenOwnerAccountB: tokenOwnerAccountB.toString(),
        //   userWallet: account.toString(),
        // })

        const [balanceA, balanceB] = await Promise.all([
          connection.getTokenAccountBalance(new PublicKey(tokenOwnerAccountA)),
          connection.getTokenAccountBalance(new PublicKey(tokenOwnerAccountB)),
        ])

        console.log('Available balances:', {
          tokenA: balanceA.value.amount,
          tokenB: balanceB.value.amount,
        })

        const quote = getIncreaseLiquidityQuote(
          { liquidity: input.liquidity },
          pool,
          initializableLowerTickIndex,
          initializableUpperTickIndex,
          1000,
          undefined,
          undefined,
        )
        console.log('QUOTE (increase_liquidity_quote fn response):', {
          liquidityAmount: quote.liquidityDelta.toString(),
          tokenMaxA: quote.tokenMaxA.toString(),
          tokenMaxB: quote.tokenMaxB.toString(),
        })

        instructions.push(
          await program.methods
            .increaseLiquidity(
              new BN(quote.liquidityDelta.toString()),
              new BN(quote.tokenMaxA.toString()),
              new BN(quote.tokenMaxB.toString()),
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
    } catch (error) {
      console.error('open position ERROR:', error)
    }
  })
