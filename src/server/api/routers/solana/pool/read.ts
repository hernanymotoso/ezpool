import { publicProcedure } from '@/server/api/trpc'
import { z } from 'zod'

export const readPool = publicProcedure
  .input(
    z.object({
      publicKey: z.string(),
      perPage: z.number().optional(),
      page: z.number().optional(),
    }),
  )
  .query(async ({ ctx, input }) => {
    console.log('input RPC')
    const accounts = await ctx.solana.program.account.whirlpool.all([
      {
        memcmp: {
          offset: 8,
          bytes: input.publicKey,
        },
      },
    ])

    if (!input?.page || !input?.perPage) return { accounts }
    const startIndex = (input.page - 1) * input.perPage
    const endIndex = startIndex + input.perPage
    const paginatedAccounts = accounts.slice(startIndex, endIndex)
    if (!paginatedAccounts?.length) {
      return { accounts: [], hasPreviousPage: false, hasNextPage: false }
    }
    const hasPreviousPage = startIndex > 0
    const hasNextPage = endIndex < accounts.length
    return { accounts: paginatedAccounts, hasPreviousPage, hasNextPage }
  })
