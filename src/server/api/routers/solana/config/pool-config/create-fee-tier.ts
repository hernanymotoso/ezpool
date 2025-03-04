import { env } from '@/env'
import { publicProcedure } from '@/server/api/trpc'
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import { z } from 'zod'

const FUNDER_WALLET = env.server.FUNDER_WALLET!
const CONFIG_ADDRESS = env.server.CONFIG_ADDRESS!

export const createFeeTier = publicProcedure
  .input(
    z.object({
      tickSpacing: z.number(),
      defaultFeeRate: z.number(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const adminWalletKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(FUNDER_WALLET)),
    )

    const tickSpacingBuffer = Buffer.alloc(2)
    tickSpacingBuffer.writeUInt16LE(input.tickSpacing, 0)

    const [feeTierPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('fee_tier'),
        new PublicKey(CONFIG_ADDRESS).toBuffer(),
        tickSpacingBuffer,
      ],
      ctx.solana.program.programId,
    )
    console.log('feeTierPda')

    return await ctx.solana.program.methods
      .initializeFeeTier(input.tickSpacing, input.defaultFeeRate)
      .accounts({
        config: CONFIG_ADDRESS,
        feeTier: feeTierPda,
        funder: adminWalletKeypair.publicKey,
        feeAuthority: adminWalletKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([adminWalletKeypair])
      .rpc()
  })
