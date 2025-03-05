import { env } from '@/env'
import { Keypair, PublicKey } from '@solana/web3.js'
import { BuildPoolPDADTO } from './types'

const WHIRLPOOL_CONFIG = process.env.NEXT_PUBLIC_CONFIG_ADDRESS!

export function getFunderKeypair(): Keypair {
  return Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(env.server.PUBLIC_FUNDER_WALLET!)),
  )
}

export function buildTickSpacingBuffer(
  tickSpacing: number,
): Buffer<ArrayBuffer> {
  const tickSpacingBuffer = Buffer.alloc(2)
  tickSpacingBuffer.writeUInt16LE(tickSpacing, 0)
  return tickSpacingBuffer
}

export function buildPoolPDA({
  tokenMintA,
  tokenMintB,
  tickSpacing,
  programId,
}: BuildPoolPDADTO) {
  const tickSpacingBuffer = buildTickSpacingBuffer(tickSpacing)

  const [poolPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('whirlpool'),
      new PublicKey(WHIRLPOOL_CONFIG).toBuffer(),
      new PublicKey(tokenMintA).toBuffer(),
      new PublicKey(tokenMintB).toBuffer(),
      tickSpacingBuffer,
    ],
    programId,
  )

  return poolPDA
}
