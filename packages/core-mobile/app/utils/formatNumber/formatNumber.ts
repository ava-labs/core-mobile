const bigNumberFormatter = Intl.NumberFormat('en-us', {
  // Compact won't work  without polyfills, so use formatLargeCurrency instead
  notation: 'compact',
  maximumFractionDigits: 2
})

export const normalNumberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const roundToFirstNonZeroDecimal = (num: number): string => {
  // Convert the number to a string in scientific notation
  const numStr = num.toExponential()

  // Extract the exponent to determine the number of leading zeros
  const allDecimals = numStr.split('e-')[1]
  const exponent = allDecimals && parseInt(allDecimals, 10)

  // If the number is not in scientific notation (no exponent), return as is
  if (!exponent || isNaN(exponent)) return num.toString()

  // Round to the first non-zero decimal place
  const rounded = parseFloat(num.toFixed(exponent))
  return rounded.toFixed(exponent)
}

/**
 * Formats numbers based on their magnitude:
 * - Values ≥ 1 Million: Uses shorthand notation (e.g., 32.2M, 1.6B).
 * - Values < 1 Million: Displays as-is with fixed decimal places (default to 2)
 * - Very small values (e.g., 0.000006): Preserves all decimal places
 *
 * @param num - The number to format.
 * @returns Formatted number as a string.
 */
export function formatNumber(num: number | string): string {
  const number = typeof num === 'number' ? num : Number(num)

  const rawValue = Math.abs(number)

  if (rawValue > 1e6) {
    // handle big numbers
    return bigNumberFormatter.format(rawValue)
  } else if (rawValue === 0) {
    // handle 0
    return '0.00'
  } else if (rawValue < 0.01) {
    // handle very small numbers
    return roundToFirstNonZeroDecimal(rawValue)
  } else {
    // handle normal numbers
    return normalNumberFormatter.format(rawValue)
  }
}
