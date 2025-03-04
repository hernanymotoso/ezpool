import { fetchAllMint } from '@solana-program/token-2022'
import { useConnection } from '@solana/wallet-adapter-react'
import { Connection } from '@solana/web3.js'
import { useMutation } from '@tanstack/react-query'
import { useProgram } from '../use-program'

type RequestThis = {
  connection: Connection
}

export type FetchAllMintDTO = {
  tokenAddresses: string[]
}

async function request(this: RequestThis, dto: FetchAllMintDTO) {
  const mints = await fetchAllMint(this.connection, [...dto.tokenAddresses])
  return mints
}

export function useFetchAllMint() {
  const { cluster } = useProgram()
  const { connection } = useConnection()
  if (!connection) throw new Error('Connect your wallet')

  return useMutation({
    mutationKey: ['ezpool', 'fetch-all-mint', { cluster }],
    mutationFn: request.bind({ connection }),
  })
}
