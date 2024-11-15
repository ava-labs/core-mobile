import Logger from 'utils/Logger'

export const toNumber = (num: string): number => {
  // remove all commas from the string
  const sanitizedStr = num.replace(/,/g, '')

  // convert to number
  const parsedNumber = Number(sanitizedStr)

  if (Number.isNaN(parsedNumber)) {
    Logger.error('string is not a valid number', num)
    return 0
  }

  return parsedNumber
}
