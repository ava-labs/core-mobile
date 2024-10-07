import { TokenUnit } from '@avalabs/core-utils-sdk'
import Big from 'big.js'

const MAX_DIGITS = 7

export default function limitInput(
  input: TokenUnit | undefined
): TokenUnit | undefined {
  if (!input) {
    return undefined
  }

  const stringAmount = input.toString().replaceAll(',', '')
  const numDigits = stringAmount.replace('.', '').length
  const extraDigits = numDigits - MAX_DIGITS
  if (extraDigits > 0) {
    const split = stringAmount.split('.')
    const decimals = split[1] ?? ''
    const trimmedDecimals = decimals.slice(0, -extraDigits)
    const trimmedDecimalsSize = trimmedDecimals.length
    const value = new Big(stringAmount).round(
      trimmedDecimalsSize,
      Big.roundDown
    )
    return new TokenUnit(0, input.getMaxDecimals(), input.getSymbol()).add(
      value
    )
  }
  return input
}

export function getMaxDecimals(
  input: TokenUnit | undefined
): number | undefined {
  if (!input) {
    return undefined
  }
  const stringAmount = input.toString().replaceAll(',', '')
  const [whole] = stringAmount.split('.')
  const maxDecimals = MAX_DIGITS - (whole?.length ?? 0)
  if (maxDecimals < 0) return 0
  return maxDecimals
}
