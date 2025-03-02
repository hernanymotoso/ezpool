import { Whirlpool } from '@project/anchor'

export type AccountType = Whirlpool extends {
  accounts: Array<{ name: string }>
}
  ? Whirlpool['accounts'][number]['name']
  : never
