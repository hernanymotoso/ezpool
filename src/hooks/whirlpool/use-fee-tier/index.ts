import { PublicKey } from '@solana/web3.js'
import { useMutation } from '@tanstack/react-query'
import { useProgram } from '../use-program'
import { FeeTierDTO, FeeTierResponse, RequestThis } from './types'
import { env } from '@/env'

async function request(
  this: RequestThis,
  dto: FeeTierDTO,
): Promise<FeeTierResponse> {
  const tickSpacingBuffer = Buffer.alloc(2)
  tickSpacingBuffer.writeUInt16LE(dto.tickSpacing, 0)
  const [feeTierPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('fee_tier'),
      new PublicKey(env.frontend.WHIRLPOOL_CONFIG_PUBLIC_KEY).toBuffer(),
      tickSpacingBuffer,
    ],
    this.program.programId,
  )
  const feeTierAccount = await this.program.account.feeTier.fetch(feeTierPDA)
  return { feeTierAccount, feeTierPDA }
}

export function useFeeTier() {
  const { cluster, program } = useProgram()
  return useMutation({
    mutationKey: ['ezpool', 'fee-tier', { cluster }],
    mutationFn: request.bind({ program }),
  })
}
