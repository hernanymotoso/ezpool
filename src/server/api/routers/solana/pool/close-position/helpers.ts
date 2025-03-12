import { PoolModel } from '@/models/pool-model'
import { WHIRLPOOL_PROGRAM_ID } from '@project/anchor'
import { IInstruction } from '@solana/kit'
import { Connection, PublicKey } from '@solana/web3.js'
import { decreaseLiquidityQuoteA } from './decrease-liquidity-quote'
import { decreaseLiquidityQuoteB } from './decrease-liquidity-quote-b'

import { getMint, getTransferFeeConfig } from '@solana/spl-token'
import { calculateSqrtPriceFromTick } from './calculateSqrtPriceFromTick'

export async function buildPositionPDA(positionMint: string) {
  const [positionPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('position'), new PublicKey(positionMint).toBuffer()],
    WHIRLPOOL_PROGRAM_ID,
  )
  return positionPDA
}

/**
 * Retrieves the current transfer fee configuration for a given token mint based on the current epoch.
 *
 * This function checks the mint's transfer fee configuration and returns the appropriate fee
 * structure (older or newer) depending on the current epoch. If no transfer fee configuration is found,
 * it returns `undefined`.
 *
 * @param {Mint} mint - The mint account of the token, which may include transfer fee extensions.
 * @param {bigint} currentEpoch - The current epoch to determine the applicable transfer fee.
 *
 * @returns {TransferFee | undefined} - The transfer fee configuration for the given mint, or `undefined` if no transfer fee is configured.
 */

export interface TransferFee {
  feeBps: number
  maxFee: bigint
}

export async function getCurrentTransferFee(
  connection: Connection,
  mintAddress: PublicKey,
  currentEpoch: bigint,
): Promise<TransferFee | undefined> {
  const mint = await getMint(connection, mintAddress)

  // Extract transfer fee config
  const feeConfig = getTransferFeeConfig(mint)
  console.log('feeConfig', feeConfig)

  if (!feeConfig) {
    return undefined
  }

  // Choose the correct transfer fee based on the current epoch
  const { olderTransferFee, newerTransferFee } = feeConfig
  const transferFee =
    currentEpoch >= newerTransferFee.epoch ? newerTransferFee : olderTransferFee

  return {
    feeBps: transferFee.transferFeeBasisPoints,
    maxFee: transferFee.maximumFee,
  }
}

// export function getCurrentTransferFee(
//   mint: MaybeAccount<Mint> | Account<Mint> | null,
//   currentEpoch: bigint,
// ): TransferFee | undefined {
//   if (
//     mint == null ||
//     ('exists' in mint && !mint.exists) ||
//     mint.data.extensions.__option === 'None'
//   ) {
//     return undefined
//   }
//   const feeConfig = mint.data.extensions.value.find(
//     x => x.__kind === 'TransferFeeConfig',
//   )
//   if (feeConfig == null) {
//     return undefined
//   }
//   const transferFee =
//     currentEpoch >= feeConfig.newerTransferFee.epoch
//       ? feeConfig.newerTransferFee
//       : feeConfig.olderTransferFee
//   return {
//     feeBps: transferFee.transferFeeBasisPoints,
//     maxFee: transferFee.maximumFee,
//   }
// }

/**
 * Represents the parameters for decreasing liquidity.
 * You must choose only one of the properties (`liquidity`, `tokenA`, or `tokenB`).
 * The SDK will compute the other two based on the input provided.
 */
export type DecreaseLiquidityQuoteParam =
  | {
      /** The amount of liquidity to decrease. */
      liquidity: bigint
    }
  | {
      /** The amount of Token A to withdraw. */
      tokenA: bigint
    }
  | {
      /** The amount of Token B to withdraw. */
      tokenB: bigint
    }

export interface DecreaseLiquidityQuote {
  liquidityDelta: bigint
  tokenEstA: bigint
  tokenEstB: bigint
  tokenMinA: bigint
  tokenMinB: bigint
}

/**
 * Represents the instructions and quote for decreasing liquidity in a position.
 */
export type DecreaseLiquidityInstructions = {
  /** The quote details for decreasing liquidity, including the liquidity delta, estimated tokens, and minimum token amounts based on slippage tolerance. */
  quote: DecreaseLiquidityQuote

  /** The list of instructions required to decrease liquidity. */
  instructions: IInstruction[]
}

export interface TickRange {
  tickLowerIndex: number
  tickUpperIndex: number
}

export function getDecreaseLiquidityQuote(
  param: DecreaseLiquidityQuoteParam,
  pool: PoolModel,
  tickRange: TickRange,
  slippageToleranceBps: number,
  transferFeeA: TransferFee | undefined,
  transferFeeB: TransferFee | undefined,
): DecreaseLiquidityQuote {
  if ('liquidity' in param) {
    return decreaseLiquidityQuote(
      param.liquidity,
      slippageToleranceBps,
      pool.sqrtPrice,
      tickRange.tickLowerIndex,
      tickRange.tickUpperIndex,
      transferFeeA?.feeBps,
      transferFeeB?.feeBps,
    )
  } else if ('tokenA' in param) {
    return decreaseLiquidityQuoteA(
      param.tokenA,
      slippageToleranceBps,
      pool.sqrtPrice,
      tickRange.tickLowerIndex,
      tickRange.tickUpperIndex,
      { maximumFee: transferFeeA!.maxFee, rate: transferFeeA!.feeBps },
      { maximumFee: transferFeeB!.maxFee, rate: transferFeeB!.feeBps },
    )
  } else {
    return decreaseLiquidityQuoteB(
      param.tokenB,
      slippageToleranceBps,
      pool.sqrtPrice,
      tickRange.tickLowerIndex,
      tickRange.tickUpperIndex,
      { maximumFee: transferFeeA!.maxFee, feeBps: transferFeeA!.feeBps },
      { maximumFee: transferFeeB!.maxFee, feeBps: transferFeeB!.feeBps },
    )
  }
}

/**
 * Interface representing the result of a decrease liquidity quote calculation
 */
export interface DecreaseLiquidityQuote2 {
  tokenEstA: bigint // Estimated amount of token A
  tokenEstB: bigint // Estimated amount of token B
  tokenMinA: bigint // Minimum amount of token A accounting for slippage
  tokenMinB: bigint // Minimum amount of token B accounting for slippage
  liquidityDelta: bigint // Amount of liquidity to decrease
}

/**
 * Calculate the quote for decreasing liquidity
 *
 * @param {bigint} liquidityDelta - The amount of liquidity to decrease
 * @param {number} slippageToleranceBps - The slippage tolerance in basis points (1 bp = 0.01%)
 * @param {bigint} currentSqrtPrice - The current sqrt price of the pool
 * @param {number} tickIndex1 - The first tick index of the position
 * @param {number} tickIndex2 - The second tick index of the position
 * @param {number} [transferFeeA] - Optional transfer fee for token A in basis points
 * @param {number} [transferFeeB] - Optional transfer fee for token B in basis points
 * @returns {DecreaseLiquidityQuote2} Quote containing estimated token amounts
 * @throws {Error} If calculation fails or parameters are invalid
 */
export function decreaseLiquidityQuote(
  liquidityDelta: bigint,
  slippageToleranceBps: number,
  currentSqrtPrice: bigint,
  tickIndex1: number,
  tickIndex2: number,
  transferFeeA?: number,
  transferFeeB?: number,
): DecreaseLiquidityQuote2 {
  // Validate inputs
  if (liquidityDelta <= BigInt(0)) {
    throw new Error('Liquidity delta must be positive')
  }

  if (slippageToleranceBps < 0 || slippageToleranceBps > 10000) {
    throw new Error('Slippage tolerance must be between 0 and 10000 bps')
  }

  if (currentSqrtPrice <= BigInt(0)) {
    throw new Error('Current sqrt price must be positive')
  }

  // Ensure tick indices are ordered
  const [tickLower, tickUpper] = [
    Math.min(tickIndex1, tickIndex2),
    Math.max(tickIndex1, tickIndex2),
  ]

  // Calculate price bounds from ticks
  const sqrtPriceLower = calculateSqrtPriceFromTick(tickLower)
  const sqrtPriceUpper = calculateSqrtPriceFromTick(tickUpper)

  // Calculate token amounts
  const [tokenEstA, tokenEstB] = calculateTokenAmounts(
    liquidityDelta,
    currentSqrtPrice,
    sqrtPriceLower,
    sqrtPriceUpper,
  )

  // Apply transfer fees if specified
  const adjustedTokenEstA = applyTransferFee(tokenEstA, transferFeeA)
  const adjustedTokenEstB = applyTransferFee(tokenEstB, transferFeeB)

  // Calculate minimum amounts based on slippage
  const tokenMinA = calculateMinAmount(adjustedTokenEstA, slippageToleranceBps)
  const tokenMinB = calculateMinAmount(adjustedTokenEstB, slippageToleranceBps)

  return {
    tokenEstA: adjustedTokenEstA,
    tokenEstB: adjustedTokenEstB,
    tokenMinA,
    tokenMinB,
    liquidityDelta,
  }
}

/**
 * Calculate token amounts based on liquidity delta and price ranges
 * @param liquidityDelta Amount of liquidity to calculate for
 * @param currentSqrtPrice Current sqrt price
 * @param sqrtPriceLower Lower sqrt price bound
 * @param sqrtPriceUpper Upper sqrt price bound
 * @returns Tuple of [tokenA amount, tokenB amount]
 */
export function calculateTokenAmounts(
  liquidityDelta: bigint,
  currentSqrtPrice: bigint,
  sqrtPriceLower: bigint,
  sqrtPriceUpper: bigint,
): [bigint, bigint] {
  let tokenA = BigInt(0)
  let tokenB = BigInt(0)

  // If current price is less than lower bound, only token A is required
  if (currentSqrtPrice < sqrtPriceLower) {
    tokenA = getAmountDeltaA(
      sqrtPriceLower,
      sqrtPriceUpper,
      liquidityDelta,
      true,
    )
  }
  // If current price is greater than upper bound, only token B is required
  else if (currentSqrtPrice >= sqrtPriceUpper) {
    tokenB = getAmountDeltaB(
      sqrtPriceLower,
      sqrtPriceUpper,
      liquidityDelta,
      true,
    )
  }
  // If current price is within bounds, both tokens are required
  else {
    tokenA = getAmountDeltaA(
      currentSqrtPrice,
      sqrtPriceUpper,
      liquidityDelta,
      true,
    )
    tokenB = getAmountDeltaB(
      sqrtPriceLower,
      currentSqrtPrice,
      liquidityDelta,
      true,
    )
  }

  return [tokenA, tokenB]
}

function applyTransferFee(amount: bigint, feeBps?: number): bigint {
  if (!feeBps || feeBps === 0) {
    return amount
  }
  return (amount * BigInt(10000 - feeBps)) / BigInt(10000)
}

function calculateMinAmount(amount: bigint, slippageBps: number): bigint {
  return (amount * BigInt(10000 - slippageBps)) / BigInt(10000)
}

/**
 * Calculate the amount A delta between two sqrt prices
 */
function getAmountDeltaA(
  sqrtPrice1: bigint,
  sqrtPrice2: bigint,
  liquidity: bigint,
  roundUp: boolean,
): bigint {
  if (sqrtPrice1 > sqrtPrice2) {
    // eslint-disable-next-line prettier/prettier
    [sqrtPrice1, sqrtPrice2] = [sqrtPrice2, sqrtPrice1]
  }

  const numerator = liquidity * (sqrtPrice2 - sqrtPrice1) * BigInt(2 ** 64)
  const denominator = sqrtPrice1 * sqrtPrice2

  let quotient = numerator / denominator
  const remainder = numerator % denominator

  if (roundUp && remainder > BigInt(0)) {
    quotient += BigInt(1)
  }

  return quotient
}

/**
 * Calculate the amount B delta between two sqrt prices
 */
function getAmountDeltaB(
  sqrtPrice1: bigint,
  sqrtPrice2: bigint,
  liquidity: bigint,
  roundUp: boolean,
): bigint {
  if (sqrtPrice1 > sqrtPrice2) {
    // eslint-disable-next-line prettier/prettier
    [sqrtPrice1, sqrtPrice2] = [sqrtPrice2, sqrtPrice1]
  }

  const priceDiff = sqrtPrice2 - sqrtPrice1
  const product = liquidity * priceDiff

  let quotient = product >> BigInt(64)
  const remainder = product & (BigInt(1) << (BigInt(64) - BigInt(1)))

  if (roundUp && remainder > BigInt(0)) {
    quotient += BigInt(1)
  }

  return quotient
}
