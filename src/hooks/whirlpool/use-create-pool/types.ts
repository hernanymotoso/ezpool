import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js'

export type RequestThis = {
  userWallerPublicKey: PublicKey
  connection: Connection
  signTransaction:
    | (<T extends Transaction | VersionedTransaction>(
        transaction: T,
      ) => Promise<T>)
    | undefined
  createPool: (dto: CreatePoolDTO) => Promise<{ serializedTransaction: string }>
}

export type CreatePoolDTO = {
  tokenMintA: string
  tokenMintB: string
  tickSpacing: number
  initialPrice?: number
  account: string
}
