/**
 * Get the index of a tick in a tick array.
 *
 * @param tickIndex - The tick index to locate
 * @param tickArrayStartIndex - The start tick index of the tick array
 * @param tickSpacing - The spacing between initialized ticks
 * @returns The index position within the tick array (0-887)
 * @throws Error if tick index is not within the tick array's range or if inputs are invalid
 */
export function getTickIndexInArray(
  tickIndex: number,
  tickArrayStartIndex: number,
  tickSpacing: number,
): number {
  // Constants from Whirlpool program
  const TICK_ARRAY_SIZE = 88
  const TICK_ARRAY_SPAN = TICK_ARRAY_SIZE * tickSpacing

  // Validate inputs
  if (tickSpacing <= 0) {
    throw new Error('Invalid tick spacing')
  }

  // Calculate the tick array's range
  const tickArrayEndIndex = tickArrayStartIndex + TICK_ARRAY_SPAN

  // Check if tick is within the array's range
  if (tickIndex < tickArrayStartIndex || tickIndex >= tickArrayEndIndex) {
    throw new Error("Tick index is not within the tick array's range")
  }

  // Check if tick index is initializable
  if (tickIndex % tickSpacing !== 0) {
    throw new Error('Tick index is not initializable')
  }

  // Calculate the relative position within the array
  const relativeTickIndex = (tickIndex - tickArrayStartIndex) / tickSpacing

  // Ensure the result is within bounds
  if (relativeTickIndex < 0 || relativeTickIndex >= TICK_ARRAY_SIZE) {
    throw new Error('Calculated tick index out of bounds')
  }

  return relativeTickIndex
}
