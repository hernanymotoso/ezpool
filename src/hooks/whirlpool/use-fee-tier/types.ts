import { ExtractAccount } from '@/utils/types/extractions'
import { Program } from '@coral-xyz/anchor'
import { Whirlpool } from '@project/anchor'
import { PublicKey } from '@solana/web3.js'

export type RequestThis = {
  program: Program<Whirlpool>
}

export type FeeTierDTO = {
  tickSpacing: number
}

export type FeeTierResponse = {
  feeTierAccount: ExtractAccount<Whirlpool['accounts'], 'feeTier'>
  feeTierPDA: PublicKey
}
