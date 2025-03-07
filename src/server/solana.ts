import { env } from '@/env'
import { AnchorProvider } from '@coral-xyz/anchor'
import { getWhirlpoolProgram } from '@project/anchor'
import { AnchorWallet } from '@solana/wallet-adapter-react'
import { clusterApiUrl, Connection } from '@solana/web3.js'

const createSolanaClient = (walletPublicKey: string) => {
  if (!walletPublicKey) throw new Error('Connect your wallet!')

  const connection = new Connection(
    clusterApiUrl(env.server.RPC_API_URL as any),
  )

  // TODO: implement sign transactions
  const dummyWallet = {
    publicKey: walletPublicKey,
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
    {
      commitment: 'confirmed',
      skipPreflight: true,
    },
  )

  const program = getWhirlpoolProgram(provider)

  return { connection, provider, program }
}

const globalForSolana = globalThis as unknown as {
  solanaClient: typeof createSolanaClient | undefined
}

export const solana = globalForSolana.solanaClient ?? createSolanaClient

if (env.server.NODE_ENV !== 'production') globalForSolana.solanaClient = solana
