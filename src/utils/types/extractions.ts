import { PublicKey } from '@solana/web3.js'

type DecodedHelper<T> = T extends 'publicKey'
  ? PublicKey
  : T extends 'u16'
  ? number
  : T extends 'u8'
  ? number
  : T extends 'u32'
  ? number
  : T extends 'u64'
  ? bigint
  : T extends 'u128'
  ? bigint
  : T extends 'i8'
  ? number
  : T extends 'i16'
  ? number
  : T extends 'i32'
  ? number
  : T extends 'i64'
  ? bigint
  : T extends 'i128'
  ? bigint
  : T extends 'bool'
  ? boolean
  : T extends 'string'
  ? string
  : T extends { defined: string }
  ? any
  : T extends any[]
  ? Array<DecodedHelper<T[0]>>
  : never

type DecodeStruct<
  T extends {
    kind: 'struct'
    fields: Array<{ name: string; type: any }>
  },
> = {
  [K in T['fields'][number] as K['name']]: DecodedHelper<K['type']>
}

export type ExtractAccount<
  T extends Array<{
    name: string
    type: {
      kind: 'struct'
      fields: Array<{ name: string; type: any }>
    }
  }>,
  K extends T[number]['name'],
> = DecodeStruct<Extract<T[number], { name: K }>['type']>
