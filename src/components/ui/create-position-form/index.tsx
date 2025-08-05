import * as whirlpoolProgram from '@/hooks/whirlpool'
import React, { useState } from 'react'
import { Card } from '../card'

export function CreatePositionForm() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleForm = () => {
    setIsOpen(!isOpen)
  }

  const { mutate, isPending } = whirlpoolProgram.useOpenPosition()
  const [formData, setFormData] = useState({
    poolAddress: '',
    liquidity: BigInt('1000'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate({
      poolAddress: formData.poolAddress,
      liquidity: formData.liquidity,
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'liquidity' ? BigInt(value) : value,
    }))
  }

  // Calculate 50/50 split for display
  const splitAmount = formData.liquidity / BigInt(2)

  return (
    <div className="w-full">
      <button
        onClick={toggleForm}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex justify-between items-center"
      >
        <span>Create New Position</span>
        <span className="text-xl">{isOpen ? '▼' : '▶'}</span>
      </button>

      {isOpen && (
        <Card className="p-4 bg-[#0b0f1a] rounded-b-lg shadow-md border-t-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Pool Address
              </label>
              <input
                type="text"
                name="poolAddress"
                value={formData.poolAddress}
                onChange={handleChange}
                placeholder="Enter Pool Address"
                className="w-full p-2 bg-[#1a1f2e] border border-gray-700 rounded-md text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Total Liquidity
              </label>
              <input
                type="number"
                name="liquidity"
                value={formData.liquidity.toString()}
                onChange={handleChange}
                min="1"
                className="w-full p-2 bg-[#1a1f2e] border border-gray-700 rounded-md text-white"
                required
              />
            </div>

            {/* Deposit Ratio Display */}
            <div className="bg-[#1a1f2e] p-4 rounded-md border border-gray-700">
              <h3 className="text-sm font-medium text-gray-200 mb-3">
                Deposit Ratio (50%/50%)
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Token A</span>
                  <span className="text-white">{splitAmount.toString()}</span>
                </div>
                <div className="h-1 w-full bg-gray-700 rounded">
                  <div className="h-full w-1/2 bg-blue-600 rounded"></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Token B</span>
                  <span className="text-white">{splitAmount.toString()}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-md transition-colors"
            >
              {isPending ? 'Creating Position...' : 'Create Position'}
            </button>
          </form>
        </Card>
      )}
    </div>
  )
}
