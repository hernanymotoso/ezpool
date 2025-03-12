interface DecreaseLiquidityQuote {
  tokenEstA: bigint
  tokenEstB: bigint
  liquidityDelta: bigint
  tokenMinA: bigint
  tokenMinB: bigint
}

interface TransferFee {
  rate: number
  maximumFee: bigint
}

/**
 * Calculate the quote for decreasing liquidity given a token a amount
 *
 * @param tokenAmountA - The amount of token a to decrease
 * @param slippageToleranceBps - The slippage tolerance in bps
 * @param currentSqrtPrice - The current sqrt price of the pool
 * @param tickIndex1 - The first tick index of the position
 * @param tickIndex2 - The second tick index of the position
 * @param transferFeeA - The transfer fee for token A in bps
 * @param transferFeeB - The transfer fee for token B in bps
 * @returns DecreaseLiquidityQuote containing the estimated token amounts
 */
export function decreaseLiquidityQuoteA(
  tokenAmountA: bigint,
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

  // Calculate liquidity from token A amount
  const liquidityFromA = calculateLiquidityFromTokenA(
    tokenAmountA,
    currentSqrtPrice,
    sqrtPriceLower,
    sqrtPriceUpper,
  )

  // Calculate token B amount based on liquidity
  const tokenB = calculateTokenB(
    liquidityFromA,
    currentSqrtPrice,
    sqrtPriceLower,
    sqrtPriceUpper,
  )

  // Apply transfer fees if provided
  const adjustedTokenA = applyTransferFee(tokenAmountA, transferFeeA)
  const adjustedTokenB = applyTransferFee(tokenB, transferFeeB)

  // Apply slippage tolerance
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
    tokenEstA: adjustedTokenA,
    tokenEstB: adjustedTokenB,
    tokenMinA,
    tokenMinB,
    liquidityDelta: liquidityFromA,
  }
}

function applyTransferFee(amount: bigint, fee?: TransferFee): bigint {
  if (!fee) return amount

  const feeAmount = (amount * BigInt(fee.rate)) / BigInt(10000)
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

const Q64 = BigInt('18446744073709551616') // 2^64 pre-calculated

/**
 * Converts a tick index to its corresponding sqrt price
 * @param tickIndex The tick index to convert
 * @returns The sqrt price as a bigint
 */
export function tickIndexToSqrtPrice(tickIndex: number): bigint {
  if (tickIndex > 0) {
    return BigInt(Math.floor(1.0001 ** (tickIndex / 2) * 2 ** 64))
  } else {
    return BigInt(
      Math.floor((1 / 1.0001 ** (Math.abs(tickIndex) / 2)) * 2 ** 64),
    )
  }
}

/**
 * Calculates the liquidity amount from token A amount and price range
 */
export function calculateLiquidityFromTokenA(
  tokenA: bigint,
  currentSqrtPrice: bigint,
  sqrtPriceLower: bigint,
  sqrtPriceUpper: bigint,
): bigint {
  // Ensure price order
  if (sqrtPriceLower > sqrtPriceUpper) {
    // eslint-disable-next-line prettier/prettier
    [sqrtPriceLower, sqrtPriceUpper] = [sqrtPriceUpper, sqrtPriceLower]
  }

  // If current price is less than lower bound
  if (currentSqrtPrice <= sqrtPriceLower) {
    return (
      (tokenA * sqrtPriceLower * sqrtPriceUpper) /
      (Q64 * (sqrtPriceUpper - sqrtPriceLower))
    )
  }
  // If current price is greater than upper bound
  else if (currentSqrtPrice >= sqrtPriceUpper) {
    return BigInt(0)
  }
  // If current price is within bounds
  else {
    return (
      (tokenA * currentSqrtPrice * sqrtPriceUpper) /
      (Q64 * (sqrtPriceUpper - currentSqrtPrice))
    )
  }
}

/**
 * Calculates the token B amount based on liquidity and price range
 */
export function calculateTokenB(
  liquidity: bigint,
  currentSqrtPrice: bigint,
  sqrtPriceLower: bigint,
  sqrtPriceUpper: bigint,
): bigint {
  // Ensure price order
  if (sqrtPriceLower > sqrtPriceUpper) {
    // eslint-disable-next-line prettier/prettier
    [sqrtPriceLower, sqrtPriceUpper] = [sqrtPriceUpper, sqrtPriceLower]
  }

  // If current price is less than lower bound
  if (currentSqrtPrice <= sqrtPriceLower) {
    return BigInt(0)
  }
  // If current price is greater than upper bound
  else if (currentSqrtPrice >= sqrtPriceUpper) {
    return (liquidity * (sqrtPriceUpper - sqrtPriceLower)) / Q64
  }
  // If current price is within bounds
  else {
    return (liquidity * (currentSqrtPrice - sqrtPriceLower)) / Q64
  }
}
