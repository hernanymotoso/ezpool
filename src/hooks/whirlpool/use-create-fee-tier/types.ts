import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js'

export type RequestThis = {
  userWallerPublicKey?: PublicKey
  connection: Connection
  signTransaction:
    | (<T extends Transaction | VersionedTransaction>(
        transaction: T,
      ) => Promise<T>)
    | undefined
  createFeeTier: (dto: CreateFeeTierDTO) => Promise<string>
}

export type CreateFeeTierDTO = {
  account: string
  tickSpacing: number
  defaultFeeRate: number
}
