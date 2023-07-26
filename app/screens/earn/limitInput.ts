import { TokenBaseUnit } from 'types/TokenBaseUnit'

const MAX_DIGITS = 7

export default function limitInput<T extends TokenBaseUnit<T>>(
  input: T | undefined
): T | undefined {
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
    return input.cut(trimmedDecimalsSize)
  }
  return input
}
