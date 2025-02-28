import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import WhirlpoolIDL from '../programs/whirlpool/idl/whirlpool.json'
import type { Whirlpool } from '../programs/whirlpool/types/whirlpool'

export { WhirlpoolIDL, type Whirlpool }

export const WHIRLPOOL_PROGRAM_ID = new PublicKey(WhirlpoolIDL.address)

export function getWhirlpoolProgram(
  provider: AnchorProvider,
  address?: PublicKey,
) {
  return new Program<Whirlpool>(
    WhirlpoolIDL as Whirlpool,
    address ? address.toBase58() : WHIRLPOOL_PROGRAM_ID,
    provider,
  )
}

export function getWhirlpoolProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
      return WHIRLPOOL_PROGRAM_ID
    case 'testnet':
      return WHIRLPOOL_PROGRAM_ID
    case 'mainnet-beta':
      return WHIRLPOOL_PROGRAM_ID
    default:
      return WHIRLPOOL_PROGRAM_ID
  }
}
