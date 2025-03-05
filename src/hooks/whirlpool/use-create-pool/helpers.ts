import { env } from '@/env'
import { Keypair } from '@solana/web3.js'

export function getFunderKeypair(): Keypair {
  return Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(env.server.PUBLIC_FUNDER_WALLET!)),
  )
}
