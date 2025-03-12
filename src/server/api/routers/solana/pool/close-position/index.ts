import { env } from '@/env'
import { publicProcedure } from '@/server/api/trpc'
import { ResourceNotFoundError } from '@/utils/errors'
import { RequiredFieldError } from '@/utils/errors/required-field-error'
import {
  findAssociatedTokenPda,
  TOKEN_2022_PROGRAM_ADDRESS,
} from '@solana-program/token-2022'
import { Address, createSolanaRpc } from '@solana/kit'
import {
  clusterApiUrl,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import BN from 'bn.js'
import { z } from 'zod'
import {
  buildTickArrayPDA,
  getTickArrayStartTickIndex,
} from '../open-position/helpers'
import { collectFeesQuote } from './collect-fees-quote'
import { getTickIndexInArray } from './get-tick-index-in-array'
import {
  buildPositionPDA,
  getCurrentTransferFee,
  getDecreaseLiquidityQuote,
} from './helpers'
import { prepareTokenAccountsInstructions } from './prepare-token-accounts-instructions'
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token'

const SLIPPAGE_TOLERANCE_BPS = 100

export const closePosition = publicProcedure
  .input(
    z.object({
      account: z.string().nonempty({ message: 'Connect your wallet!' }),
      positionMintAddress: z
        .string()
        .nonempty({ message: 'Position mint is required!' }),
      slippageToleranceBps: z
        .number()
        .optional()
        .default(SLIPPAGE_TOLERANCE_BPS),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    if (!input?.account) throw new RequiredFieldError('Account')
    if (!input?.positionMintAddress)
      throw new RequiredFieldError('Position mint')
    const { account, positionMintAddress, slippageToleranceBps } = input
    const { program, connection } = ctx.solana(account)

    const positionAddress = await buildPositionPDA(positionMintAddress)
    const position = await program.account.position.fetch(positionAddress)
    if (!position) throw new ResourceNotFoundError('Position')
    const pool = await program.account.whirlpool.fetch(position.whirlpool)
    if (!pool) throw new ResourceNotFoundError('Pool')

    const { epoch: currentEpoch } = await connection.getEpochInfo()

    const rpc = createSolanaRpc(clusterApiUrl(env.server.RPC_API_URL as any))

    const mintAccounts = await connection.getMultipleAccountsInfo([
      pool.tokenMintA,
      pool.tokenMintB,
      new PublicKey(positionMintAddress),
      ...pool.rewardInfos.map(x => x.mint),
    ])

    if (!mintAccounts[0] || !mintAccounts[1] || !mintAccounts[2]) {
      throw new ResourceNotFoundError('Mint accounts')
    }

    const mintA = { address: pool.tokenMintA.toString(), data: mintAccounts[0] }
    const mintB = { address: pool.tokenMintB.toString(), data: mintAccounts[1] }
    const positionMint = { address: positionMintAddress, data: mintAccounts[2] }
    const rewardMints = pool.rewardInfos.map((x, i) => ({
      address: x.mint.toString(),
      data: mintAccounts[i + 3],
    }))

    console.log('mintA', mintA.address.toString())
    console.log('mintB', mintB.address.toString())
    console.log('positionMint', positionMint.address.toString())
    console.log(
      'rewardMints',
      rewardMints.map(x => x.address.toString()),
    )

    const transferFeeA = await getCurrentTransferFee(
      connection,
      pool.tokenMintA,
      BigInt(currentEpoch),
    )
    const transferFeeB = await getCurrentTransferFee(
      connection,
      pool.tokenMintA,
      BigInt(currentEpoch),
    )

    const quote = getDecreaseLiquidityQuote(
      { liquidity: BigInt(position.liquidity.toString()) },
      pool as any,
      {
        tickLowerIndex: position.tickLowerIndex,
        tickUpperIndex: position.tickUpperIndex,
      },
      slippageToleranceBps,
      transferFeeA,
      transferFeeB,
    )

    const lowerTickArrayStartIndex = getTickArrayStartTickIndex(
      position.tickLowerIndex,
      pool.tickSpacing,
    )
    const upperTickArrayStartIndex = getTickArrayStartTickIndex(
      position.tickUpperIndex,
      pool.tickSpacing,
    )

    // Get the mint account info to determine which token program it belongs to
    const positionMintInfo = await connection.getAccountInfo(
      new PublicKey(positionMint.address.toString()),
    )

    if (!positionMintInfo?.owner)
      throw new ResourceNotFoundError('Position mint owner')

    const [positionTokenAccountPDA] = await findAssociatedTokenPda({
      owner: account.toString() as any,
      mint: positionMintAddress as any,
      tokenProgram: positionMintInfo.owner.toString() as any,
    })
    const lowerTickArrayPDA = buildTickArrayPDA(
      position.whirlpool,
      lowerTickArrayStartIndex,
      program.programId,
    )
    const upperTickArrayPDA = buildTickArrayPDA(
      position.whirlpool,
      upperTickArrayStartIndex,
      program.programId,
    )

    const lowerTickArray = await program.account.tickArray.fetch(
      lowerTickArrayPDA,
    )
    if (!lowerTickArray) throw new ResourceNotFoundError('Lower tick array')
    const upperTickArray = await program.account.tickArray.fetch(
      upperTickArrayPDA,
    )
    if (!upperTickArray) throw new ResourceNotFoundError('Upper tick array')

    const lowerTick =
      lowerTickArray.ticks[
        getTickIndexInArray(
          position.tickLowerIndex,
          lowerTickArrayStartIndex,
          pool.tickSpacing,
        )
      ]

    const upperTick =
      upperTickArray.ticks[
        getTickIndexInArray(
          position.tickUpperIndex,
          upperTickArrayStartIndex,
          pool.tickSpacing,
        )
      ]

    const feesQuote = collectFeesQuote(
      pool as any,
      position as any,
      {
        ...lowerTick,
        tickIndex: position.tickLowerIndex,
        feeGrowthOutsideA: lowerTick.feeGrowthOutsideA,
        feeGrowthOutsideB: lowerTick.feeGrowthOutsideB,
      },
      {
        ...upperTick,
        tickIndex: position.tickUpperIndex,
        feeGrowthOutsideA: upperTick.feeGrowthOutsideA,
        feeGrowthOutsideB: upperTick.feeGrowthOutsideB,
      },
      {
        feeBps: transferFeeA?.feeBps ?? 0,
        maximumFee: new BN(transferFeeA?.maxFee?.toString() ?? '0'),
      },
      {
        feeBps: transferFeeB?.feeBps ?? 0,
        maximumFee: new BN(transferFeeB?.maxFee?.toString() ?? '0'),
      },
    )
    console.log('here2')

    const requiredMints = new Set<Address>()
    if (
      quote.liquidityDelta > BigInt(0) ||
      BigInt(feesQuote.feeOwedA.toString()) > BigInt(0) ||
      BigInt(feesQuote.feeOwedB.toString()) > BigInt(0)
    ) {
      requiredMints.add(pool.tokenMintA.toString() as any)
      requiredMints.add(pool.tokenMintB.toString() as any)
    }
    console.log('here3', requiredMints)
    const instructions: TransactionInstruction[] = []
    const { createInstructions, cleanupInstructions, tokenAccountAddresses } =
      await prepareTokenAccountsInstructions(
        rpc,
        account.toString() as any,
        Array.from(requiredMints),
      )

    instructions.push(...createInstructions)

    if (quote.liquidityDelta > 0n) {
      instructions.push(
        await program.methods
          .decreaseLiquidity(
            new BN(position.liquidity.toString()),
            new BN(quote.tokenMinA.toString()),
            new BN(quote.tokenMinB.toString()),
          )
          .accounts({
            whirlpool: position.whirlpool,
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
            positionAuthority: account,
            position: positionAddress,
            positionTokenAccount: positionTokenAccountPDA,
            tokenOwnerAccountA:
              tokenAccountAddresses[pool.tokenMintA.toString() as any],
            tokenOwnerAccountB:
              tokenAccountAddresses[pool.tokenMintB.toString() as any],
            tokenVaultA: pool.tokenVaultA,
            tokenVaultB: pool.tokenVaultB,
            tickArrayLower: lowerTickArrayPDA,
            tickArrayUpper: upperTickArrayPDA,
          })
          .instruction(),
      )
    }

    if (
      BigInt(feesQuote.feeOwedA.toString()) > BigInt(0) ||
      BigInt(feesQuote.feeOwedB.toString()) > BigInt(0)
    ) {
      instructions.push(
        await program.methods
          .collectFees()
          .accounts({
            whirlpool: position.whirlpool,
            positionAuthority: account,
            position: positionAddress,
            positionTokenAccount: positionTokenAccountPDA,
            tokenOwnerAccountA:
              tokenAccountAddresses[pool.tokenMintA.toString() as any],
            tokenOwnerAccountB:
              tokenAccountAddresses[pool.tokenMintB.toString() as any],
            tokenVaultA: pool.tokenVaultA,
            tokenVaultB: pool.tokenVaultB,
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
          })
          .instruction(),
      )
    }

    switch (positionMintInfo?.owner?.toString() as any) {
      case TOKEN_PROGRAM_ADDRESS:
        instructions.push(
          await program.methods
            .closePosition()
            .accounts({
              positionAuthority: account,
              position: positionAddress,
              positionTokenAccount: positionTokenAccountPDA,
              positionMint: positionMintAddress,
              receiver: account,
              tokenProgram: TOKEN_PROGRAM_ADDRESS,
            })
            .instruction(),
        )
        break
      case TOKEN_2022_PROGRAM_ADDRESS:
        instructions.push(
          await program.methods
            .closePositionWithTokenExtensions()
            .accounts({
              positionAuthority: account,
              position: positionAddress,
              positionTokenAccount: positionTokenAccountPDA,
              positionMint: positionMintAddress,
              receiver: account,
              token2022Program: TOKEN_2022_PROGRAM_ADDRESS,
            })
            .instruction(),
        )
        break
      default:
        throw new Error('Invalid token program')
    }

    instructions.push(...cleanupInstructions)

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash()
    const transaction = new Transaction({
      feePayer: new PublicKey(account),
      blockhash,
      lastValidBlockHeight,
    }).add(...instructions)

    const serializedTransaction = transaction
      .serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      })
      .toString('base64')

    console.log('quote', quote)
    console.log('feesQuote', feesQuote)

    return {
      serializedTransaction,
      quote,
      feesQuote,
    }
  })
