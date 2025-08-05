import { Program } from '@coral-xyz/anchor'
import { Whirlpool } from '@project/anchor'
import { PublicKey } from '@solana/web3.js'

export type InitializeConfigDTO = {
  defaultProtocolFeeRate: number
}

export type InitializeConfigResponse = {
  signature: string
  funderPubkey: PublicKey
}

export type RequestThis = {
  program: Program<Whirlpool>
}
