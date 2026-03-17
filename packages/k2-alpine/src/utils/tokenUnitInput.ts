import { TokenUnit } from '@avalabs/core-utils-sdk'

const MAX_DIGITS = 7

export function getMaxDecimals(input: TokenUnit): number {
  const stringAmount = input.toString().replaceAll(',', '')
  const [whole] = stringAmount.split('.')
  const maxDecimals = MAX_DIGITS - (whole?.length ?? 0)
  if (maxDecimals < 0) return 0
  return maxDecimals
}

export const normalizeValue = (value: string): string => {
  // If the string consists solely of zeros (optionally ending with a dot),
  // return "0" or "0." accordingly.
  if (/^0+\.?$/.test(value)) {
    return value.includes('.') ? '0.' : '0'
  }
  // Otherwise, remove all leading zeros.
  let normalized = value.replace(/^0+/, '')
  // If the result starts with a dot, prepend a "0"
  if (normalized.startsWith('.')) {
    normalized = '0' + normalized
  }
  return normalized
}

export const normalizeErrorMessage = (errorMessage: string): string => {
  return errorMessage.replace(/\r?\n/g, ' ').replace(/ +/g, ' ')
}

export function splitIntegerAndFraction(val: string): (string | null)[] {
  return val.includes('.') ? val.split('.') : [val, null]
}

export const normalizeNumericTextInput = (txt: string): string => {
  let normalized = txt.replace(',', '.')
  normalized = normalized.replace(/[^.\d]/g, '') //remove non-digits
  normalized = normalized.replace(/^0+/g, '0') //remove starting double 0
  normalized = normalized.replace(/^0(?=\d)/g, '') //remove starting 0 if next one is digit
  let numOfDots = 0
  normalized = normalized.replace(/\./g, substring => {
    //remove extra decimal points
    if (numOfDots === 0) {
      numOfDots++
      return substring
    }
    return ''
  })

  return normalized
}

/**
 * Parses a decimal string to BigInt with specified decimals.
 * This avoids JavaScript Number precision issues with large decimal values.
 *
 * @example
 * parseDecimalToBigInt("0.15358017127655023", 18) => 153580171276550230n
 * parseDecimalToBigInt("1.5", 18) => 1500000000000000000n
 */
export const parseDecimalToBigInt = (
  value: string,
  decimals: number
): bigint => {
  if (!value || value === '0' || value === '0.') return 0n

  // Remove commas from formatted numbers
  const cleanValue = value.replace(/,/g, '')

  const [integerPart = '0', decimalPart = ''] = cleanValue.split('.')

  // Pad or truncate the decimal part to match the specified decimals
  const paddedDecimal = decimalPart.padEnd(decimals, '0').slice(0, decimals)

  // Combine integer and decimal parts, then convert to BigInt
  const combined = integerPart + paddedDecimal

  // Remove leading zeros but keep at least one digit
  const trimmed = combined.replace(/^0+/, '') || '0'

  return BigInt(trimmed)
}
