'use client'

import { useWhirlpoolProgram } from './whirlpool-data-access'

export function WhirlpoolData() {
  const { accounts: acc } = useWhirlpoolProgram()

  console.log({ acc })

  return (
    <div className={'space-y-6'}>
      <h1>test</h1>
    </div>
  )
}
