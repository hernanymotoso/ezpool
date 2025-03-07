import { env } from '@/env'
import { getKeypairFromSecretKey } from '@/server/api/helpers'
import { publicProcedure } from '@/server/api/trpc'
import { RequiredFieldError } from '@/utils/errors/required-field-error'
import { SystemProgram } from '@solana/web3.js'
import { z } from 'zod'
import { buildFeeTierPDA } from './helpers'

export const createFeeTier = publicProcedure
  .input(
    z.object({
      account: z.string().nonempty({ message: 'Connect your wallet!' }),
      tickSpacing: z.number(),
      defaultFeeRate: z.number(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    if (!input?.account) throw new RequiredFieldError('Account')
    const { program } = ctx.solana(input.account)
    const funderKeypair = getKeypairFromSecretKey(
      env.server.FUNDER_WALLET_SECRET_KEY,
    )

    const feeTierPda = buildFeeTierPDA(input.tickSpacing, program.programId)

    return await program.methods
      .initializeFeeTier(input.tickSpacing, input.defaultFeeRate)
      .accounts({
        config: env.server.CONFIG_WALLET_PUBLIC_KEY,
        feeTier: feeTierPda,
        funder: funderKeypair.publicKey,
        feeAuthority: funderKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([funderKeypair])
      .rpc()
  })
