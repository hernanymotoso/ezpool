import { Program } from '@coral-xyz/anchor'
import { Whirlpool } from '@project/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import { FeeTierDTO, FeeTierResponse } from '../use-fee-tier/types'

export type RequestThis = {
  program: Program<Whirlpool>
  getFeeTier: (dto: FeeTierDTO) => Promise<FeeTierResponse>
  connection: Connection
  userWalletPublicKey: PublicKey
}

export type CreatePoolDTO = {
  tokenMintA: string
  tokenMintB: string
  tickSpacing: number
  initialPrice?: number
}
