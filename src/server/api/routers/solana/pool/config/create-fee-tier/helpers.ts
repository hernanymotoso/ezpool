import { env } from '@/env'
import { buildTickSpacingBuffer } from '@/server/api/helpers'
import { PublicKey } from '@solana/web3.js'

// TODO: We have the same helper on the create-pool, maybe put it in a common folder
export function buildFeeTierPDA(tickSpacing: number, programId: PublicKey) {
  const tickSpacingBuffer = buildTickSpacingBuffer(tickSpacing)
  const [feeTierPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('fee_tier'),
      new PublicKey(env.server.CONFIG_WALLET_PUBLIC_KEY).toBuffer(),
      tickSpacingBuffer,
    ],
    programId,
  )

  return feeTierPDA
}
