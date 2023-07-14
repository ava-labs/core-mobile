import BN from 'bn.js'
import { bnToLocaleString } from '@avalabs/utils-sdk'
import { stringToBigint } from 'utils/bigNumbers/stringToBigint'

const MAX_DIGITS = 7

export default function sanitizeInput(
  input: bigint | undefined,
  denomination: number
): bigint | undefined {
  if (!input) {
    return input
  }
  const inputBN = new BN(input.toString())
  const stringAmount = bnToLocaleString(inputBN, denomination).replaceAll(
    ',',
    ''
  )
  const numDigits = stringAmount.replace('.', '').length
  const extraDigits = numDigits - MAX_DIGITS
  if (extraDigits > 0) {
    const split = stringAmount.split('.')
    const whole = split[0]
    const decimals = split[1] ?? ''
    const trimmedDecimals = decimals.slice(0, -extraDigits)
    const trimmed = `${whole}${trimmedDecimals && '.'}${trimmedDecimals}`
    return stringToBigint(trimmed, denomination)
  }
  return input
}
