import { env } from '@/env'
import {
  buildFeeTierPDA,
  getKeypairFromSecretKey,
} from '@/server/api/routers/solana/helpers'
import { publicProcedure } from '@/server/api/trpc'
import { RequiredFieldError } from '@/utils/errors/required-field-error'
import { SystemProgram } from '@solana/web3.js'
import { z } from 'zod'

export const createFeeTier = publicProcedure
  .input(
    z.object({
      account: z.string().nonempty({ message: 'Connect your wallet!' }),
      tickSpacing: z.number().int().positive(),
      defaultFeeRate: z
        .number({
          required_error: 'Default Fee Rate is required',
          invalid_type_error: 'Default Fee Rate must be a number',
        })
        .int()
        .nonnegative(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    if (!input?.account) throw new RequiredFieldError('Account')
    if (!input?.defaultFeeRate) throw new RequiredFieldError('Default Fee Rate')
    if (!input?.tickSpacing) throw new RequiredFieldError('Tick Spacing')
    const funderKeypair = getKeypairFromSecretKey(
      env.server.FUNDER_WALLET_SECRET_KEY,
    )
    const { program } = ctx.solana(funderKeypair.publicKey.toString())

    const feeTierPda = buildFeeTierPDA(input.tickSpacing, program.programId)

    console.log('defaultFeeRate:', input.defaultFeeRate)
    console.log('tickSpacing:', input.tickSpacing)
    const tx = null

    console.log('feeTierPda:', funderKeypair.publicKey.toString())

    // tx = await program.methods
    //   .initializeFeeTier(input.tickSpacing, input.defaultFeeRate)
    //   .accounts({
    //     config: env.server.CONFIG_WALLET_PUBLIC_KEY,
    //     feeTier: feeTierPda,
    //     funder: funderKeypair.publicKey,
    //     feeAuthority: funderKeypair.publicKey,
    //     systemProgram: SystemProgram.programId,
    //   })
    //   .signers([funderKeypair])
    //   .rpc({ skipPreflight: true })
    return tx
  })
