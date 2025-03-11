import { publicProcedure } from '@/server/api/trpc'
import { RequiredFieldError } from '@/utils/errors/required-field-error'
import { z } from 'zod'
import { fetchPositionsForOwner } from './helpers'

export const fetchPositions = publicProcedure
  .input(
    z.object({
      account: z.string().nonempty('Connect your waller!'),
    }),
  )
  .query(async ({ ctx, input }) => {
    if (!input.account) throw new RequiredFieldError('Account')
    const { account } = input
    const { connection } = ctx.solana(account)
    const positions = await fetchPositionsForOwner(connection, account)
    return { positions }
  })
