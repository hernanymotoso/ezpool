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
  closePosition: (
    dto: ClosePositionDTO,
  ) => Promise<{ serializedTransaction: string }>
}

export type ClosePositionDTO = {
  account: string
  positionMintAddress: string
  slippageToleranceBps?: number | undefined
}
