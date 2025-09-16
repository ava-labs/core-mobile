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
