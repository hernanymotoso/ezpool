import { env } from '@/env'
import { buildTickSpacingBuffer } from '@/server/api/routers/solana/helpers'
import { ResourceNotFoundError } from '@/utils/errors'
import { getMint } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { BuildPoolPDADTO, GetTokenInfoDTO } from './types'

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
      new PublicKey(env.server.CONFIG_WALLET_PUBLIC_KEY).toBuffer(),
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
      new PublicKey(env.server.CONFIG_WALLET_PUBLIC_KEY).toBuffer(),
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
