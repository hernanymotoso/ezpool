import { AnchorProvider } from '@coral-xyz/anchor'
import { getWhirlpoolProgram as getWhirlpoolProgramMain } from '@project/anchor'
import { AnchorWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey } from '@solana/web3.js'

export function getWhirlpoolProgram(
  senderPublicKey: PublicKey,
  connection: Connection,
) {
  // TODO: implement sign transactions
  const dummyWallet = {
    publicKey: senderPublicKey,
    signTransaction: () => {
      throw new Error('Not implemented')
    },
    signAllTransactions: () => {
      throw new Error('Not implemented')
    },
  }

  const provider = new AnchorProvider(
    connection,
    dummyWallet as unknown as AnchorWallet,
    { commitment: 'confirmed', skipPreflight: true },
  )

  const program = getWhirlpoolProgramMain(provider)

  return { program }
}
