import { UNKNOWN_AMOUNT } from 'consts/amount'
import { normalNumberFormatter } from 'utils/formatNumber/formatNumber'

const DIGIT_LIMIT = 5

export const numberToSubscriptFormat = (
  number: number | undefined
): {
  mainTextBefore: string
  subText: string
  mainTextAfter: string
} => {
  if (typeof number !== 'number')
    return {
      mainTextBefore: UNKNOWN_AMOUNT,
      subText: '',
      mainTextAfter: ''
    }

  // Handle 0
  if (number === 0)
    return {
      mainTextBefore: '0',
      subText: '',
      mainTextAfter: ''
    }

  // Handle less than 0
  if (number < 0) {
    const sign = '-'
    const pos = numberToSubscriptFormat(Math.abs(number))
    return {
      mainTextBefore: sign + pos.mainTextBefore,
      subText: pos.subText,
      mainTextAfter: pos.mainTextAfter
    }
  }

  if (number >= 1000) {
    return {
      mainTextBefore: normalNumberFormatter.format(number).toString(),
      subText: '',
      mainTextAfter: ''
    }
  }

  // Handle greater than 0.00001
  if (number > 0.00001) {
    // For regular numbers, limit to 5 digits (excluding decimal) and round up
    const roundedNumber = limitAndRoundNumber(number)

    return {
      mainTextBefore: roundedNumber.toString(),
      subText: '',
      mainTextAfter: ''
    }
  }

  // Handle numbers less than 0.00001
  // Convert to scientific notation string if not already
  const sciNotation = number.toExponential()

  // Example: "8.4509221e-7" → "8.4509221" and "-7"
  const [coefficient, exponent] = sciNotation.split('e')

  // If either part is missing, return original number
  if (!coefficient || !exponent) {
    return {
      mainTextBefore: number.toString(),
      subText: '',
      mainTextAfter: ''
    }
  }

  // Parse exponent, if invalid return original number
  const expNum = parseInt(exponent, 10)

  if (isNaN(expNum)) {
    return {
      mainTextBefore: number.toString(),
      subText: '',
      mainTextAfter: ''
    }
  }

  const absExpNum = Math.abs(expNum)

  // Split coefficient into parts
  const coeffParts = coefficient.split('.')
  const digitsBeforeDecimal = coeffParts?.[0]?.length

  // If digitsBeforeDecimal is undefined, return original number
  if (digitsBeforeDecimal === undefined) {
    return {
      mainTextBefore: number.toString(),
      subText: '',
      mainTextAfter: ''
    }
  }

  // Count number of 0s
  const zeroCount = absExpNum - digitsBeforeDecimal // e.g., 7 - 1 = 6

  // Get significant digits (remove decimal, take first 2)
  const significantDigits = coefficient.replace('.', '').slice(0, 2)

  return {
    mainTextBefore: '0.0',
    subText: zeroCount.toString(), // Number of zeros as subscript
    mainTextAfter: significantDigits
  }
}

// https://stackoverflow.com/questions/72630881/limit-and-round-number
const limitAndRoundNumber = (number: number): number => {
  const wholeDigits = Math.ceil(number).toString().length
  const power = wholeDigits <= DIGIT_LIMIT ? DIGIT_LIMIT - wholeDigits : 0
  const multiplier = 10 ** power

  return Math.ceil(number * multiplier) / multiplier
}
