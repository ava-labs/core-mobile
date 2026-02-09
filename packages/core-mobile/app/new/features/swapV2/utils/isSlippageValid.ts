import { MIN_SLIPPAGE_PERCENT, MAX_SLIPPAGE_PERCENT } from '../consts'

export const isSlippageValid = (value: string): boolean => {
  if (!value || value.length === 0) {
    return false
  }

  const numValue = parseFloat(value)

  return (
    !Number.isNaN(numValue) &&
    numValue >= MIN_SLIPPAGE_PERCENT &&
    numValue <= MAX_SLIPPAGE_PERCENT
  )
}
