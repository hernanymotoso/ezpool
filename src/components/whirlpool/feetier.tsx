'use client'
import { CreateFeeTierForm } from '../ui/create-fee-tier-form'
import FeeTierTable from '../ui/fee-tier-table'

export function FeetierData() {
  return (
    <div className="flex w-full flex-col gap-2 mt-4">
      <FeeTierTable />
      <CreateFeeTierForm />
    </div>
  )
}
