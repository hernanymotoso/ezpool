import { Keypair } from '@solana/web3.js'

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
