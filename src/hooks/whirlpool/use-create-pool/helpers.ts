import { env } from '@/env'
import { ResourceNotFoundError } from '@/utils/errors'
import { getMint } from '@solana/spl-token'
import { Keypair, PublicKey } from '@solana/web3.js'
import { BuildPoolPDADTO, GetTokenInfoDTO } from './types'

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

export function buildTokenBadgePDA(tokenMint: string, programId: PublicKey) {
  const [tokenBadgePDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('token_badge'),
      new PublicKey(WHIRLPOOL_CONFIG).toBuffer(),
      new PublicKey(tokenMint).toBuffer(),
    ],
    programId,
  )

  return tokenBadgePDA
}

export async function getTokenInfo({ connection, tokenMint }: GetTokenInfoDTO) {
  const [tokenInfo, mintInfo] = await Promise.all([
    connection.getAccountInfo(new PublicKey(tokenMint)),
    getMint(connection, new PublicKey(tokenMint)),
  ])
  if (!tokenInfo?.owner || !mintInfo.address) {
    throw new ResourceNotFoundError('Token Info')
  }

  return {
    tokenProgram: tokenInfo.owner.toBase58(),
    decimals: mintInfo.decimals,
  }
}
