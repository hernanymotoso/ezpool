import {
  increase_liquidity_quote,
  increase_liquidity_quote_a,
  increase_liquidity_quote_b,
} from '@/lib/wasm/pkg/orca_whirlpools_core'
import {
  Commitment,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js'

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

export interface IncreaseLiquidityQuote {
  liquidityDelta: bigint
  tokenEstA: bigint
  tokenEstB: bigint
  tokenMaxA: bigint
  tokenMaxB: bigint
}

/**
 * Represents the parameters for increasing liquidity.
 * You must choose only one of the properties (`liquidity`, `tokenA`, or `tokenB`).
 * The SDK will compute the other two based on the input provided.
 */
export type IncreaseLiquidityQuoteParam =
  | {
      /** The amount of liquidity to increase. */
      liquidity: bigint
    }
  | {
      /** The amount of Token A to add. */
      tokenA: bigint
    }
  | {
      /** The amount of Token B to add. */
      tokenB: bigint
    }

/**
 * Represents the instructions and quote for increasing liquidity in a position.
 */
export type IncreaseLiquidityInstructions = {
  /** The quote object with details about the increase in liquidity, including the liquidity delta, estimated tokens, and maximum token amounts based on slippage tolerance. */
  quote: IncreaseLiquidityQuote

  /** List of Solana transaction instructions to execute. */
  instructions: TransactionInstruction[]
}

export interface TransferFee {
  feeBps: number
  maxFee: bigint
}

export function getIncreaseLiquidityQuote(
  param: IncreaseLiquidityQuoteParam,
  pool: any,
  tickLowerIndex: number,
  tickUpperIndex: number,
  slippageToleranceBps: number,
  transferFeeA: TransferFee | undefined,
  transferFeeB: TransferFee | undefined,
): IncreaseLiquidityQuote {
  if ('liquidity' in param) {
    console.log('increase_liquidity_quote PARAMS', {
      liquidity_delta: param.liquidity,
      slippage_tolerance_bps: slippageToleranceBps,
      current_sqrt_price: pool.sqrtPrice.toString(),
      tick_index_1: tickLowerIndex,
      tick_index_2: tickUpperIndex,
      transfer_fee_a: transferFeeA,
      transfer_fee_b: transferFeeB,
    })
    return increase_liquidity_quote(
      param.liquidity,
      slippageToleranceBps,
      BigInt(pool.sqrtPrice.toString()),
      tickLowerIndex,
      tickUpperIndex,
      transferFeeA,
      transferFeeB,
    )
  } else if ('tokenA' in param) {
    return increase_liquidity_quote_a(
      param.tokenA,
      slippageToleranceBps,
      BigInt(pool.sqrtPrice.toString()),
      tickLowerIndex,
      tickUpperIndex,
      transferFeeA,
      transferFeeB,
    )
  } else {
    return increase_liquidity_quote_b(
      param.tokenB,
      slippageToleranceBps,
      BigInt(pool.sqrtPrice.toString()),
      tickLowerIndex,
      tickUpperIndex,
      transferFeeA,
      transferFeeB,
    )
  }
}
