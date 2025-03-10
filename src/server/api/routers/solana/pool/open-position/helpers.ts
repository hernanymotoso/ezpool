import { Commitment, Connection, PublicKey } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import Decimal from 'decimal.js'

const DEFAULT_SPACE = 200
export const TICK_ARRAY_SIZE = 88 // Whirlpool constant

export async function fetchSysvarRent(
  connection: Connection,
  accountSize: number = DEFAULT_SPACE,
) {
  const rentExemptionAmount =
    await connection.getMinimumBalanceForRentExemption(accountSize)
  return rentExemptionAmount
}

export function orderTickIndexes(tickIndex1: number, tickIndex2: number) {
  const lowerTickIndex = Math.min(tickIndex1, tickIndex2)
  const upperTickIndex = Math.max(tickIndex1, tickIndex2)
  return { lowerTickIndex, upperTickIndex }
}

export function getInitializableTickIndex(
  tickIndex: number,
  tickSpacing: number,
  roundUp?: boolean,
): number {
  if (tickSpacing <= 0) {
    throw new Error('tickSpacing must be greater than zero')
  }

  if (tickIndex % tickSpacing === 0) {
    return tickIndex
  }

  if (roundUp === undefined) {
    return Math.round(tickIndex / tickSpacing) * tickSpacing
  }

  return roundUp
    ? Math.ceil(tickIndex / tickSpacing) * tickSpacing
    : Math.floor(tickIndex / tickSpacing) * tickSpacing
}

export function getTickArrayStartTickIndex(
  tickIndex: number,
  tickSpacing: number,
): number {
  const realIndex = Math.floor(tickIndex / tickSpacing)
  const startTickIndex =
    Math.floor(realIndex / TICK_ARRAY_SIZE) * TICK_ARRAY_SIZE * tickSpacing
  return startTickIndex
}

export function buildPositionPDA(
  positionMint: PublicKey,
  programId: PublicKey,
) {
  const [positionPDA, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('position'), new PublicKey(positionMint).toBuffer()],
    programId,
  )

  return { positionPDA, positionBump: bump }
}

export function buildTickArrayPDA(
  pool: PublicKey,
  startTickIndex: number,
  programId: PublicKey,
) {
  const [tickArrayPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('tick_array'),
      new PublicKey(pool).toBuffer(),
      Buffer.from(`${startTickIndex}`),
    ],
    programId,
  )

  return tickArrayPDA
}

interface FetchConfig {
  commitment?: Commitment | undefined
}

export async function fetchAllMaybeTickArray(
  connection: Connection,
  addresses: PublicKey[],
  config?: FetchConfig,
) {
  const accounts = await connection.getMultipleAccountsInfo(addresses, config)

  return accounts.map(maybeAccount => {
    if (maybeAccount) {
      return decodeTickArray(maybeAccount.data)
    }
    return null
  })
}

function decodeTickArray(data: Buffer): any {
  return { decodedData: data.toString() }
}

interface IncreaseLiquidityQuote {
  tokenMaxA: BN
  tokenMaxB: BN
  liquidityAmount: BN
}

interface QuoteParams {
  liquidityDelta: BN | bigint | string
  slippageToleranceBps: number
  currentSqrtPrice: Decimal | string
  tickIndex1: number
  tickIndex2: number
  transferFeeA?: number
  transferFeeB?: number
}

export function increaseLiquidityQuote({
  liquidityDelta,
  slippageToleranceBps,
  currentSqrtPrice,
  tickIndex1,
  tickIndex2,
  transferFeeA = 0,
  transferFeeB = 0,
}: QuoteParams): IncreaseLiquidityQuote {
  try {
    const liquidity = new BN(liquidityDelta.toString())
    const sqrtPrice = new Decimal(currentSqrtPrice.toString())

    const [lowerTickIndex, upperTickIndex] = [
      Math.min(tickIndex1, tickIndex2),
      Math.max(tickIndex1, tickIndex2),
    ]

    const sqrtPriceLower = getSqrtPriceAtTick(lowerTickIndex)
    const sqrtPriceUpper = getSqrtPriceAtTick(upperTickIndex)

    const tokenAAmount = calculateTokenA(
      liquidity,
      sqrtPrice,
      sqrtPriceLower,
      sqrtPriceUpper,
    )
    const tokenBAmount = calculateTokenB(
      liquidity,
      sqrtPrice,
      sqrtPriceLower,
      sqrtPriceUpper,
    )

    const slippageFactor = new Decimal(1 + slippageToleranceBps / 10000)
    const tokenMaxA = new BN(tokenAAmount.mul(slippageFactor).ceil().toString())
    const tokenMaxB = new BN(tokenBAmount.mul(slippageFactor).ceil().toString())

    if (transferFeeA > 0) {
      const feeFactorA = new Decimal(1 + transferFeeA / 10000)
      tokenMaxA.imul(new BN(feeFactorA.ceil().toString()))
    }
    if (transferFeeB > 0) {
      const feeFactorB = new Decimal(1 + transferFeeB / 10000)
      tokenMaxB.imul(new BN(feeFactorB.ceil().toString()))
    }

    return {
      tokenMaxA,
      tokenMaxB,
      liquidityAmount: liquidity,
    }
  } catch (error) {
    throw new Error(`Failed to calculate liquidity quote: ${error}`)
  }
}

function getSqrtPriceAtTick(tick: number): Decimal {
  const power = new Decimal(tick).div(2).div(Decimal.log10(1.0001))
  return new Decimal(1.0001).pow(power)
}

function calculateTokenA(
  liquidity: BN,
  currentSqrtPrice: Decimal,
  sqrtPriceLower: Decimal,
  sqrtPriceUpper: Decimal,
): Decimal {
  const liq = new Decimal(liquidity.toString())
  if (currentSqrtPrice.lessThan(sqrtPriceLower)) {
    return liq
      .mul(sqrtPriceUpper.minus(sqrtPriceLower))
      .div(sqrtPriceUpper.mul(sqrtPriceLower))
  } else if (currentSqrtPrice.lessThan(sqrtPriceUpper)) {
    return liq
      .mul(sqrtPriceUpper.minus(currentSqrtPrice))
      .div(sqrtPriceUpper.mul(currentSqrtPrice))
  }
  return new Decimal(0)
}

function calculateTokenB(
  liquidity: BN,
  currentSqrtPrice: Decimal,
  sqrtPriceLower: Decimal,
  sqrtPriceUpper: Decimal,
): Decimal {
  const liq = new Decimal(liquidity.toString())
  if (currentSqrtPrice.lessThan(sqrtPriceLower)) {
    return new Decimal(0)
  } else if (currentSqrtPrice.lessThan(sqrtPriceUpper)) {
    return liq.mul(currentSqrtPrice.minus(sqrtPriceLower))
  }
  return liq.mul(sqrtPriceUpper.minus(sqrtPriceLower))
}
