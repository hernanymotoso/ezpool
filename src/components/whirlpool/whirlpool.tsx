'use client'
import * as whirlpoolProgram from '@/hooks/whirlpool'

export function WhirlpoolData() {
  const { mutate, isPending } = whirlpoolProgram.useCreatePool()

  console.log('is Pending:', isPending)

  return (
    <div className={'space-y-6'}>
      <h1>test</h1>
      <button
        onClick={() =>
          mutate({
            tokenMintA: 'So11111111111111111111111111111111111111112',
            tokenMintB: 'ZCBTEJwQpWQVbjqyVZycS9uZdyNW6NC98N62pRJvGFM',
            tickSpacing: 10,
            initialPrice: 2,
          })
        }
      >
        Create Fee Tier
      </button>
    </div>
  )
}
