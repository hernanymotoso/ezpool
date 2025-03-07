import { Connection, PublicKey } from '@solana/web3.js'

export type BuildPoolPDADTO = {
  tokenMintA: string
  tokenMintB: string
  tickSpacing: number
  programId: PublicKey
}

export type GetTokenInfoDTO = {
  connection: Connection
  tokenMint: string
}
