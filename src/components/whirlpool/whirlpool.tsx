'use client'
import * as whirlpoolProgram from '@/hooks/whirlpool'

export function WhirlpoolData() {
  const { mutate: createPool } = whirlpoolProgram.useCreatePool()
  const { mutate } = whirlpoolProgram.useOpenPosition()
  const { data } = whirlpoolProgram.usePools()
  const { data: positions } = whirlpoolProgram.useFetchPositions()

  // Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr

  console.log('pools', data)
  console.log('POSITIONS', positions)
  return (
    <div className={'space-y-6'}>
      <h1>test</h1>
      <button
        onClick={() =>
          createPool({
            tokenMintA: '68sfq2YwWmrhjXGNok5Nk2wPDGC4QvE74AxRuXAKHvu5',
            tokenMintB: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
            tickSpacing: 10,
            initialPrice: 1,
          })
        }
      >
        Create pool
      </button>
      <button
        onClick={() =>
          mutate({
            poolAddress: '4p1VLUoJFDNqyrhm1kx82XwtuXbwyfRRWrGbNjfBZrEH',
            liquidity: BigInt('1'),
          })
        }
      >
        Create position
      </button>
    </div>
  )
}
