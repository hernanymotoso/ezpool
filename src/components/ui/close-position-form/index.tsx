import * as whirlpoolProgram from '@/hooks/whirlpool'
import React, { useState } from 'react'
import { Card } from '../card'

export function ClosePositionForm() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleForm = () => {
    setIsOpen(!isOpen)
  }

  const { mutate, isPending } = whirlpoolProgram.useClosePosition()
  const [formData, setFormData] = useState({
    positionMintAddress: '',
    slippageToleranceBps: 100, // Default 1% slippage
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate({
      positionMintAddress: formData.positionMintAddress,
      slippageToleranceBps: formData.slippageToleranceBps,
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'slippageToleranceBps' ? Number(value) : value,
    }))
  }

  return (
    <div className="w-full">
      <button
        onClick={toggleForm}
        className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex justify-between items-center"
      >
        <span>Close Position</span>
        <span className="text-xl">{isOpen ? '▼' : '▶'}</span>
      </button>

      {isOpen && (
        <Card className="p-4 bg-[#0b0f1a] rounded-b-lg shadow-md border-t-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Position Mint Address
              </label>
              <input
                type="text"
                name="positionMintAddress"
                value={formData.positionMintAddress}
                onChange={handleChange}
                placeholder="Enter Position Mint Address"
                className="w-full p-2 bg-[#1a1f2e] border border-gray-700 rounded-md text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Slippage Tolerance (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="slippageToleranceBps"
                  value={formData.slippageToleranceBps / 100}
                  onChange={e => {
                    const value = Number(e.target.value)
                    setFormData(prev => ({
                      ...prev,
                      slippageToleranceBps: value * 100,
                    }))
                  }}
                  min="0.01"
                  max="100"
                  step="0.01"
                  className="w-full p-2 bg-[#1a1f2e] border border-gray-700 rounded-md text-white pr-8"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  %
                </span>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-red-900/20 border border-red-500/50 rounded-md p-3">
              <p className="text-sm text-red-200">
                Warning: Closing a position will remove your liquidity and
                collect any accumulated fees. This action cannot be undone.
              </p>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-md transition-colors"
            >
              {isPending ? 'Closing Position...' : 'Close Position'}
            </button>
          </form>
        </Card>
      )}
    </div>
  )
}
