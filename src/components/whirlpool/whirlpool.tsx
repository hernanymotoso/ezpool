'use client'
import LiquidityTable from '../ui/liquidity-table'
import MyPositionsTable from '../ui/my-positions-table'
import { CreatePoolForm } from '../ui/create-pool-form'
import { CreatePositionForm } from '../ui/create-position-form'
import { ClosePositionForm } from '../ui/close-position-form'
import FeeTierTable from '../ui/fee-tier-table'

export function WhirlpoolData() {
  return (
    <>
      <div className="flex flex-col gap-4 mt-4">
        <h1>Available Pools</h1>
        <LiquidityTable />
      </div>

      <div className="flex flex-col gap-4 mt-4">
        <CreatePoolForm />
      </div>

      <div className="flex flex-col gap-4 mt-10">
        <h1>My positions</h1>
        <MyPositionsTable />
      </div>

      <div className="flex flex-col gap-4 mt-2">
        <CreatePositionForm />
      </div>
      <div className="flex flex-col gap-4 mt-2">
        <ClosePositionForm />
      </div>
    </>
  )
}
