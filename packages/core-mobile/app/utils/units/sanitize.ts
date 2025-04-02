// ensure only one decimal point
const enforceSingleDecimal = (text: string): string => {
  const parts = text.split('.')
  return parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : text
}

// limit decimal places
const limitDecimalPlaces = (text: string, maxDecimals = 5): string => {
  const parts = text.split('.')

  return parts.length === 2 && parts[1] && parts[1].length > maxDecimals
    ? parts[0] + '.' + parts[1].slice(0, maxDecimals)
    : text
}

export const sanitizeDecimalInput = ({
  text,
  maxDecimals = 5,
  allowDecimalPoint
}: {
  text: string
  maxDecimals?: number
  allowDecimalPoint: boolean
}): string => {
  let sanitized = allowDecimalPoint
    ? text.replace(/[^0-9.]/g, '') // allow only numbers and decimal point
    : text.replace(/[^0-9]/g, '') // allow only numbers

  sanitized = enforceSingleDecimal(sanitized)
  return limitDecimalPlaces(sanitized, maxDecimals)
}
