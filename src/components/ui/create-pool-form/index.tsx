import * as whirlpoolProgram from '@/hooks/whirlpool'
import React, { useState } from 'react'
import { Card } from '../card'

export function CreatePoolForm() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleForm = () => {
    setIsOpen(!isOpen)
  }

  const { mutate, isPending } = whirlpoolProgram.useCreatePool()
  const [formData, setFormData] = useState({
    tokenMintA: '',
    tokenMintB: '',
    tickSpacing: 10,
    initialPrice: 1,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'tickSpacing' || name === 'initialPrice'
          ? Number(value)
          : value,
    }))
  }

  return (
    <div className="w-full">
      <button
        onClick={toggleForm}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex justify-between items-center"
      >
        <span>Create New Pool</span>
        <span className="text-xl">{isOpen ? '▼' : '▶'}</span>
      </button>

      {isOpen && (
        <Card className="p-4 bg-[#0b0f1a] rounded-b-lg shadow-md border-t-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Token Mint A
              </label>
              <input
                type="text"
                name="tokenMintA"
                value={formData.tokenMintA}
                onChange={handleChange}
                placeholder="Enter Token Mint A address"
                className="w-full p-2 bg-[#1a1f2e] border border-gray-700 rounded-md text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Token Mint B
              </label>
              <input
                type="text"
                name="tokenMintB"
                value={formData.tokenMintB}
                onChange={handleChange}
                placeholder="Enter Token Mint B address"
                className="w-full p-2 bg-[#1a1f2e] border border-gray-700 rounded-md text-white"
                required
              />
            </div>

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
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Initial Price
              </label>
              <input
                type="number"
                name="initialPrice"
                value={formData.initialPrice}
                onChange={handleChange}
                min="0"
                step="0.000001"
                className="w-full p-2 bg-[#1a1f2e] border border-gray-700 rounded-md text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-md transition-colors"
            >
              {isPending ? 'Creating Pool...' : 'Create Pool'}
            </button>
          </form>
        </Card>
      )}
    </div>
  )
}
