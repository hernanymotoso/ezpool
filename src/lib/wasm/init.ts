import initWasm, { price_to_sqrt_price } from './pkg/orca_whirlpools_core'
import fs from 'fs'
import path from 'path'

let initialized = false

export async function initializeWasm() {
  if (initialized) return

  try {
    if (typeof window === 'undefined') {
      // Server-side initialization
      const wasmPath = path.join(
        process.cwd(),
        'src/lib/wasm/pkg/orca_whirlpools_core_bg.wasm',
      )
      const wasmBuffer = fs.readFileSync(wasmPath)
      await initWasm(wasmBuffer)
    } else {
      // Client-side initialization
      await initWasm()
    }
    initialized = true
  } catch (error) {
    console.error('Failed to initialize WASM:', error)
    throw error
  }
}

export { price_to_sqrt_price }
