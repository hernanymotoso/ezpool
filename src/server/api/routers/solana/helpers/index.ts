import { env } from '@/env'
import { Keypair, PublicKey } from '@solana/web3.js'

export function getKeypairFromSecretKey(secretKey: string): Keypair {
  return Keypair.fromSecretKey(new Uint8Array(JSON.parse(secretKey)))
}

export function buildTickSpacingBuffer(
  tickSpacing: number,
): Buffer<ArrayBuffer> {
  const tickSpacingBuffer = Buffer.alloc(2)
  tickSpacingBuffer.writeUInt16LE(tickSpacing, 0)
  return tickSpacingBuffer
}

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
