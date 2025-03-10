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
  openPosition: (
    dto: OpenPositionDTO,
  ) => Promise<{ serializedTransaction: string }>
}

export type OpenPositionDTO = {
  poolAddress: string
  liquidity?: bigint
  account: string
}
