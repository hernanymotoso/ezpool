import { tickIndexToSqrtPrice } from './decrease-liquidity-quote'

interface DecreaseLiquidityQuote {
  liquidityDelta: bigint
  tokenEstA: bigint
  tokenEstB: bigint
  tokenMinA: bigint
  tokenMinB: bigint
}

interface TransferFee {
  feeBps: number
  maximumFee: bigint
}

/**
 * Calculate the quote for decreasing liquidity given a token b amount
 *
 * @param tokenAmountB - The amount of token b to decrease
 * @param slippageToleranceBps - The slippage tolerance in bps
 * @param currentSqrtPrice - The current sqrt price of the pool
 * @param tickIndex1 - The first tick index of the position
 * @param tickIndex2 - The second tick index of the position
 * @param transferFeeA - The transfer fee for token A
 * @param transferFeeB - The transfer fee for token B
 * @returns DecreaseLiquidityQuote containing the estimated token amounts
 */
export function decreaseLiquidityQuoteB(
  tokenAmountB: bigint,
  slippageToleranceBps: number,
  currentSqrtPrice: bigint,
  tickIndex1: number,
  tickIndex2: number,
  transferFeeA?: TransferFee,
  transferFeeB?: TransferFee,
): DecreaseLiquidityQuote {
  // Ensure tick indices are ordered
  const [tickLower, tickUpper] =
    tickIndex1 < tickIndex2
      ? [tickIndex1, tickIndex2]
      : [tickIndex2, tickIndex1]

  // Calculate sqrt prices for the ticks
  const sqrtPriceLower = tickIndexToSqrtPrice(tickLower)
  const sqrtPriceUpper = tickIndexToSqrtPrice(tickUpper)

  // Calculate liquidity from token B amount
  const liquidityFromB = calculateLiquidityFromTokenB(
    tokenAmountB,
    currentSqrtPrice,
    sqrtPriceLower,
    sqrtPriceUpper,
  )

  // Calculate token amounts based on liquidity
  const tokenEstB = tokenAmountB
  const tokenEstA = calculateTokenAFromLiquidity(
    liquidityFromB,
    currentSqrtPrice,
    sqrtPriceLower,
    sqrtPriceUpper,
  )

  // Apply transfer fees if provided
  const adjustedTokenA = applyTransferFee(tokenEstA, transferFeeA)
  const adjustedTokenB = applyTransferFee(tokenEstB, transferFeeB)

  // Calculate minimum amounts with slippage
  const tokenMinA = adjustForSlippage(
    adjustedTokenA,
    slippageToleranceBps,
    false,
  )
  const tokenMinB = adjustForSlippage(
    adjustedTokenB,
    slippageToleranceBps,
    false,
  )

  return {
    liquidityDelta: liquidityFromB,
    tokenEstA: adjustedTokenA,
    tokenEstB: adjustedTokenB,
    tokenMinA,
    tokenMinB,
  }
}

function calculateLiquidityFromTokenB(
  tokenB: bigint,
  currentSqrtPrice: bigint,
  sqrtPriceLower: bigint,
  sqrtPriceUpper: bigint,
): bigint {
  const Q64 = BigInt('18446744073709551616') // 2^64

  // If current price is less than lower bound
  if (currentSqrtPrice <= sqrtPriceLower) {
    return BigInt(0)
  }
  // If current price is greater than upper bound
  else if (currentSqrtPrice >= sqrtPriceUpper) {
    return (tokenB * Q64) / (sqrtPriceUpper - sqrtPriceLower)
  }
  // If current price is within bounds
  else {
    return (tokenB * Q64) / (currentSqrtPrice - sqrtPriceLower)
  }
}

function calculateTokenAFromLiquidity(
  liquidity: bigint,
  currentSqrtPrice: bigint,
  sqrtPriceLower: bigint,
  sqrtPriceUpper: bigint,
): bigint {
  const Q64 = BigInt('18446744073709551616') // 2^64

  // If current price is less than lower bound
  if (currentSqrtPrice <= sqrtPriceLower) {
    return (
      (liquidity * Q64 * (sqrtPriceUpper - sqrtPriceLower)) /
      (sqrtPriceLower * sqrtPriceUpper)
    )
  }
  // If current price is greater than upper bound
  else if (currentSqrtPrice >= sqrtPriceUpper) {
    return BigInt(0)
  }
  // If current price is within bounds
  else {
    return (
      (liquidity * Q64 * (sqrtPriceUpper - currentSqrtPrice)) /
      (currentSqrtPrice * sqrtPriceUpper)
    )
  }
}

function applyTransferFee(amount: bigint, fee?: TransferFee): bigint {
  if (!fee) return amount
  const feeAmount = (amount * BigInt(fee.feeBps)) / BigInt(10000)
  return amount - (feeAmount > fee.maximumFee ? fee.maximumFee : feeAmount)
}

function adjustForSlippage(
  amount: bigint,
  slippageBps: number,
  roundUp: boolean,
): bigint {
  const slippageMultiplier = roundUp
    ? BigInt(10000 + slippageBps)
    : BigInt(10000 - slippageBps)
  return (amount * slippageMultiplier) / BigInt(10000)
}
