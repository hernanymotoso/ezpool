import { Keypair } from '@solana/web3.js'

export function getKeypairFromSecretKey(secretKey: string): Keypair {
  return Keypair.fromSecretKey(new Uint8Array(JSON.parse(secretKey)))
}
