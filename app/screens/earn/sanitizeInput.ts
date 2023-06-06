import BN from 'bn.js'
import { bnToLocaleString, stringToBN } from '@avalabs/utils-sdk'
const MAX_DIGITS = 7

export default function sanitizeInput(
  input: BN | undefined,
  denomination: number
): BN | undefined {
  if (!input) {
    return input
  }
  const stringAmount = bnToLocaleString(input, denomination).replaceAll(',', '')
  const numDigits = stringAmount.replace('.', '').length
  const extraDigits = numDigits - MAX_DIGITS
  if (extraDigits > 0) {
    const split = stringAmount.split('.')
    const whole = split[0]
    const decimals = split[1] ?? ''
    const trimmedDecimals = decimals.slice(0, -extraDigits)
    const trimmed = `${whole}${trimmedDecimals && '.'}${trimmedDecimals}`
    return stringToBN(trimmed, denomination)
  }
  return input
}
