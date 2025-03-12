// Constants from the Rust implementation
const MAX_SQRT_PRICE_X64 = BigInt('79226673515401279992447579055')
const MIN_SQRT_PRICE_X64 = BigInt('4295048016')

/**
 * Calculate the sqrt price (Q64.64) from a tick index
 *
 * @param tick - The tick index to convert to a sqrt price
 * @returns The sqrt price as a Q64.64 fixed-point number (bigint)
 * @throws If the resulting price is outside the valid range
 */
export function calculateSqrtPriceFromTick(tick: number): bigint {
  if (tick > 0) {
    return getSqrtPricePositiveTick(tick)
  } else {
    return getSqrtPriceNegativeTick(tick)
  }
}

/**
 * Calculate sqrt price for positive tick indices
 */
function getSqrtPricePositiveTick(tick: number): bigint {
  // Rust: const Q32: i32 = 0x100000000
  const Q32 = 0x100000000

  // Early return for tick 0
  if (tick === 0) {
    return BigInt(1) << BigInt(64)
  }

  let ratio: bigint

  // Handle different tick ranges
  if (tick > 0 && tick < Q32) {
    ratio = BigInt(1) << BigInt(tick)
  } else {
    ratio = 2n ** BigInt(tick)
  }

  let sqrtPrice = ratio * (BigInt(1) << BigInt(64))

  // Ensure the result is within bounds
  if (sqrtPrice > MAX_SQRT_PRICE_X64) {
    sqrtPrice = MAX_SQRT_PRICE_X64
  }

  return sqrtPrice
}

/**
 * Calculate sqrt price for negative tick indices
 */
function getSqrtPriceNegativeTick(tick: number): bigint {
  // Rust: const Q32: i32 = 0x100000000
  const Q32 = 0x100000000

  let ratio: bigint

  // Handle different tick ranges
  if (tick < 0 && tick > -Q32) {
    ratio = 1n << BigInt(-tick)
  } else {
    ratio = 2n ** BigInt(-tick)
  }

  // Calculate sqrt price with proper fixed-point arithmetic
  let sqrtPrice = ((1n << 128n) / ratio) >> 64n

  // Ensure the result is within bounds
  if (sqrtPrice < MIN_SQRT_PRICE_X64) {
    sqrtPrice = MIN_SQRT_PRICE_X64
  }

  return sqrtPrice
}

/**
 * Convert a price to sqrt price in Q64.64 format
 *
 * @param price - The price to convert
 * @param decimalsA - Decimals of token A
 * @param decimalsB - Decimals of token B
 * @returns The sqrt price in Q64.64 format
 */
export function priceToSqrtPriceX64(
  price: number,
  decimalsA: number,
  decimalsB: number,
): bigint {
  const power = Math.pow(10, decimalsA - decimalsB)
  const sqrtPrice = Math.sqrt(price / power)
  return BigInt(Math.floor(sqrtPrice * Math.pow(2, 64)))
}

/**
 * Convert a sqrt price in Q64.64 format to a decimal price
 *
 * @param sqrtPriceX64 - The sqrt price in Q64.64 format
 * @param decimalsA - Decimals of token A
 * @param decimalsB - Decimals of token B
 * @returns The decimal price
 */
export function sqrtPriceX64ToPrice(
  sqrtPriceX64: bigint,
  decimalsA: number,
  decimalsB: number,
): number {
  const power = Math.pow(10, decimalsA - decimalsB)
  const sqrtPrice = Number(sqrtPriceX64) / Math.pow(2, 64)
  return Math.pow(sqrtPrice, 2) * power
}
