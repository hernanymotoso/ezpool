import { env } from '@/env'
import { publicProcedure } from '@/server/api/trpc'
import { RequiredFieldError } from '@/utils/errors/required-field-error'
import { z } from 'zod'

export const readPool = publicProcedure
  .input(
    z.object({
      account: z.string().nonempty('Connect your wallet!'),
      perPage: z.number().optional(),
      page: z.number().optional(),
    }),
  )
  .query(async ({ ctx, input }) => {
    if (!input?.account) throw new RequiredFieldError('Account')
    const { program } = ctx.solana(input.account)

    const accounts = await program.account.whirlpool.all([
      {
        memcmp: {
          offset: 8,
          bytes: env.server.CONFIG_WALLET_PUBLIC_KEY,
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
