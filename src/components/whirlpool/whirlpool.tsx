'use client'
import * as whirlpoolProgram from '@/hooks/whirlpool'

export function WhirlpoolData() {
  const { data, isLoading } = whirlpoolProgram.usePools()

  console.log('MY DATA', data)
  console.log('MY Is loading', isLoading)

  return (
    <div className={'space-y-6'}>
      <h1>test</h1>
    </div>
  )
}
