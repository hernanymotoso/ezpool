import { env } from '@/env'
import { publicProcedure } from '@/server/api/trpc'
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import { z } from 'zod'

const FUNDER_WALLET_SECRET_KEY = env.server.FUNDER_WALLET_SECRET_KEY!
const CONFIG_WALLET_PUBLIC_KEY = env.server.CONFIG_WALLET_PUBLIC_KEY!

export const createFeeTier = publicProcedure
  .input(
    z.object({
      tickSpacing: z.number(),
      defaultFeeRate: z.number(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const funderKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(FUNDER_WALLET_SECRET_KEY)),
    )

    const tickSpacingBuffer = Buffer.alloc(2)
    tickSpacingBuffer.writeUInt16LE(input.tickSpacing, 0)

    const [feeTierPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('fee_tier'),
        new PublicKey(CONFIG_WALLET_PUBLIC_KEY).toBuffer(),
        tickSpacingBuffer,
      ],
      ctx.solana.program.programId,
    )

    return await ctx.solana.program.methods
      .initializeFeeTier(input.tickSpacing, input.defaultFeeRate)
      .accounts({
        config: CONFIG_WALLET_PUBLIC_KEY,
        feeTier: feeTierPda,
        funder: funderKeypair.publicKey,
        feeAuthority: funderKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([funderKeypair])
      .rpc()
  })
