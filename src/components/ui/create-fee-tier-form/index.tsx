import * as whirlpoolProgram from '@/hooks/whirlpool'
import React, { useState } from 'react'
import { Card } from '../card'
import { FEE_RATE_RATIO } from '../fee-tier-table'

export function CreateFeeTierForm() {
  const [isOpen, setIsOpen] = useState(false)
  const { mutate, isPending } = whirlpoolProgram.useCreateFeeTier()
  const [formData, setFormData] = useState({
    tickSpacing: 1,
    defaultFeeRate: FEE_RATE_RATIO, // 1% default fee rate (in basis points)
  })

  const toggleForm = () => {
    setIsOpen(!isOpen)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate({
      tickSpacing: formData.tickSpacing,
      defaultFeeRate: formData.defaultFeeRate,
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: Number(value),
    }))
  }

  return (
    <div className="w-full">
      <button
        onClick={toggleForm}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex justify-between items-center"
      >
        <span>Create New Fee Tier</span>
        <span className="text-xl">{isOpen ? '▼' : '▶'}</span>
      </button>

      {isOpen && (
        <Card className="p-4 bg-[#0b0f1a] rounded-b-lg shadow-md border-t-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Tick Spacing
              </label>
              <input
                type="number"
                name="tickSpacing"
                value={formData.tickSpacing}
                onChange={handleChange}
                min="1"
                className="w-full p-2 bg-[#1a1f2e] border border-gray-700 rounded-md text-white"
                required
              />
              <p className="text-xs text-gray-400">
                Minimum price movement. Larger values enable cheaper trades.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Default Fee Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="defaultFeeRate"
                  value={formData.defaultFeeRate / 100}
                  onChange={e => {
                    const value = Number(e.target.value)
                    setFormData(prev => ({
                      ...prev,
                      defaultFeeRate: value * 100,
                    }))
                  }}
                  min="0.01"
                  max="100"
                  step="0.01"
                  className="w-full p-2 bg-[#1a1f2e] border border-gray-700 rounded-md text-white pr-8"
                  required
                />
                <span className="absolute right-3 top-2 text-gray-400">%</span>
              </div>
              <p className="text-xs text-gray-400">
                Trading fee percentage. Higher fees earn more for liquidity
                providers.
              </p>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-md transition-colors"
            >
              {isPending ? 'Creating Fee Tier...' : 'Create Fee Tier'}
            </button>
          </form>
        </Card>
      )}
    </div>
  )
}
