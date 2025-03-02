import { useQuery } from '@tanstack/react-query'
import { useProgram } from '../use-program'
import { AccountType } from './types'
import { InvalidParamError } from '@/utils/errors'

export function useAccounts(type: AccountType) {
  const { program, cluster } = useProgram()
  const isValidType = type && program.account?.[type]

  return useQuery({
    queryKey: ['ezpool', 'accounts', type, { cluster }],
    queryFn: async () => {
      if (!isValidType) return new InvalidParamError('type')
      return await program.account[type].all()
    },
    enabled: Boolean(type),
  })
}
