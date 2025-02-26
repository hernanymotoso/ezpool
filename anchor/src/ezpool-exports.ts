// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import EzpoolIDL from '../target/idl/ezpool.json'
import type { Ezpool } from '../target/types/ezpool'

// Re-export the generated IDL and type
export { Ezpool, EzpoolIDL }

// The programId is imported from the program IDL.
export const EZPOOL_PROGRAM_ID = new PublicKey(EzpoolIDL.address)

// This is a helper function to get the Ezpool Anchor program.
export function getEzpoolProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...EzpoolIDL, address: address ? address.toBase58() : EzpoolIDL.address } as Ezpool, provider)
}

// This is a helper function to get the program ID for the Ezpool program depending on the cluster.
export function getEzpoolProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Ezpool program on devnet and testnet.
      return new PublicKey('coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF')
    case 'mainnet-beta':
    default:
      return EZPOOL_PROGRAM_ID
  }
}
