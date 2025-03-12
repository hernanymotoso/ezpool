import { ExtractAccount } from '@/utils/types/extractions'
import { Whirlpool } from '@project/anchor'
import BN from 'bn.js'

interface TickData {
  feeGrowthOutsideA: BN
  feeGrowthOutsideB: BN
  tickIndex: number
}

interface TransferFee {
  feeBps: number
  maximumFee: BN
}

interface CollectFeesQuote {
  feeOwedA: BN
  feeOwedB: BN
}

/**
 * Calculate fees owed for a position
 *
 * @param whirlpool - The whirlpool state
 * @param position - The position state
 * @param tickLower - The lower tick state
 * @param tickUpper - The upper tick state
 * @param transferFeeA - Optional transfer fee for token A
 * @param transferFeeB - Optional transfer fee for token B
 * @returns CollectFeesQuote containing the fees owed for token A and token B
 */
export function collectFeesQuote(
  whirlpool: ExtractAccount<Whirlpool['accounts'], 'whirlpool'>,
  position: ExtractAccount<Whirlpool['accounts'], 'position'>,
  tickLower: TickData,
  tickUpper: TickData,
  transferFeeA?: TransferFee,
  transferFeeB?: TransferFee,
): CollectFeesQuote {
  const { feeGrowthBelowA, feeGrowthBelowB } = getFeeGrowthBelow(
    whirlpool.tickCurrentIndex,
    tickLower,
    new BN(whirlpool.feeGrowthGlobalA.toString()),
    new BN(whirlpool.feeGrowthGlobalB.toString()),
  )

  const { feeGrowthAboveA, feeGrowthAboveB } = getFeeGrowthAbove(
    whirlpool.tickCurrentIndex,
    tickUpper,
    new BN(whirlpool.feeGrowthGlobalA.toString()),
    new BN(whirlpool.feeGrowthGlobalB.toString()),
  )

  // Calculate fee growth inside the position's range
  const feeGrowthInsideA = calculateFeeGrowthInside(
    new BN(whirlpool.feeGrowthGlobalA.toString()),
    feeGrowthBelowA,
    feeGrowthAboveA,
  )

  const feeGrowthInsideB = calculateFeeGrowthInside(
    new BN(whirlpool.feeGrowthGlobalB.toString()),
    feeGrowthBelowB,
    feeGrowthAboveB,
  )

  // Calculate fees owed
  let feeOwedA = calculateFeeOwed(
    new BN(position.liquidity.toString()),
    feeGrowthInsideA,
    new BN(position.feeGrowthCheckpointA.toString()),
  )

  let feeOwedB = calculateFeeOwed(
    new BN(position.liquidity.toString()),
    feeGrowthInsideB,
    new BN(position.feeGrowthCheckpointB.toString()),
  )

  // Apply transfer fees if provided
  if (transferFeeA) {
    feeOwedA = applyTransferFee(feeOwedA, transferFeeA)
  }
  if (transferFeeB) {
    feeOwedB = applyTransferFee(feeOwedB, transferFeeB)
  }

  return {
    feeOwedA,
    feeOwedB,
  }
}

function getFeeGrowthBelow(
  currentTickIndex: number,
  tickLower: TickData,
  feeGrowthGlobalA: BN,
  feeGrowthGlobalB: BN,
) {
  if (currentTickIndex >= tickLower.tickIndex) {
    return {
      feeGrowthBelowA: tickLower.feeGrowthOutsideA,
      feeGrowthBelowB: tickLower.feeGrowthOutsideB,
    }
  }
  return {
    feeGrowthBelowA: feeGrowthGlobalA.sub(tickLower.feeGrowthOutsideA),
    feeGrowthBelowB: feeGrowthGlobalB.sub(tickLower.feeGrowthOutsideB),
  }
}

function getFeeGrowthAbove(
  currentTickIndex: number,
  tickUpper: TickData,
  feeGrowthGlobalA: BN,
  feeGrowthGlobalB: BN,
) {
  if (currentTickIndex >= tickUpper.tickIndex) {
    return {
      feeGrowthAboveA: feeGrowthGlobalA.sub(tickUpper.feeGrowthOutsideA),
      feeGrowthAboveB: feeGrowthGlobalB.sub(tickUpper.feeGrowthOutsideB),
    }
  }
  return {
    feeGrowthAboveA: tickUpper.feeGrowthOutsideA,
    feeGrowthAboveB: tickUpper.feeGrowthOutsideB,
  }
}

function calculateFeeGrowthInside(
  feeGrowthGlobal: BN,
  feeGrowthBelow: BN,
  feeGrowthAbove: BN,
): BN {
  return feeGrowthGlobal.sub(feeGrowthBelow).sub(feeGrowthAbove)
}

function calculateFeeOwed(
  liquidity: BN,
  feeGrowthInside: BN,
  feeGrowthCheckpoint: BN,
): BN {
  const Q64 = new BN('18446744073709551616') // 2^64
  return liquidity.mul(feeGrowthInside.sub(feeGrowthCheckpoint)).div(Q64)
}

function applyTransferFee(amount: BN, fee: TransferFee): BN {
  const TEN_THOUSAND = new BN(10000)
  const feeAmount = amount.mul(new BN(fee.feeBps)).div(TEN_THOUSAND)
  return amount.sub(BN.min(feeAmount, fee.maximumFee))
}
