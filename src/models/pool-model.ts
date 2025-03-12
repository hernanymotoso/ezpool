import { Address, ReadonlyUint8Array } from '@solana/kit'

export type PoolModel = {
  discriminator: ReadonlyUint8Array
  whirlpoolsConfig: Address
  whirlpoolBump: ReadonlyUint8Array
  tickSpacing: number
  tickSpacingSeed: ReadonlyUint8Array
  feeRate: number
  protocolFeeRate: number
  liquidity: bigint
  sqrtPrice: bigint
  tickCurrentIndex: number
  protocolFeeOwedA: bigint
  protocolFeeOwedB: bigint
  tokenMintA: Address
  tokenVaultA: Address
  feeGrowthGlobalA: bigint
  tokenMintB: Address
  tokenVaultB: Address
  feeGrowthGlobalB: bigint
  rewardLastUpdatedTimestamp: bigint
  rewardInfos: WhirlpoolRewardInfo[]
}

type WhirlpoolRewardInfo = {
  mint: Address
  vault: Address
  authority: Address
  emissionsPerSecondX64: bigint
  growthGlobalX64: bigint
}
