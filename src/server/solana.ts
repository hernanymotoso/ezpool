import { env } from '@/env'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Whirlpool, WHIRLPOOL_PROGRAM_ID, WhirlpoolIDL } from '@project/anchor'
import { Connection, Keypair } from '@solana/web3.js'

const SOLANA_RPC_URL = env.server.SOLANA_RPC_URL!
const FUNDER_WALLET_SECRET_KEY = env.server.FUNDER_WALLET_SECRET_KEY!

const createSolanaClient = () => {
  const connection = new Connection(SOLANA_RPC_URL, 'confirmed')
  const funderKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(FUNDER_WALLET_SECRET_KEY)),
  )
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: funderKeypair.publicKey,
      signTransaction: async tx => {
        if ('partialSign' in tx) {
          tx.partialSign(funderKeypair)
        } else {
          tx.sign([funderKeypair])
        }
        return tx
      },
      signAllTransactions: async txs => {
        return txs.map(tx => {
          if ('partialSign' in tx) {
            tx.partialSign(funderKeypair)
          } else {
            tx.sign([funderKeypair])
          }
          return tx
        })
      },
    },
    {
      commitment: 'confirmed',
    },
  )

  const program = new Program(
    WhirlpoolIDL as Whirlpool,
    WHIRLPOOL_PROGRAM_ID,
    provider,
  )

  return { connection, provider, program }
}

const globalForSolana = globalThis as unknown as {
  solanaClient: ReturnType<typeof createSolanaClient> | undefined
}

export const solana = globalForSolana.solanaClient ?? createSolanaClient()

if (env.server.NODE_ENV !== 'production') globalForSolana.solanaClient = solana
