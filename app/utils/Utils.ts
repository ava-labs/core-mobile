import Big from 'big.js'
import { BigNumber, BigNumberish } from 'ethers'
import { BNLike } from 'ethereumjs-util'

export const truncateAddress = (address: string, size = 6): string => {
  const firstChunk = address.substring(0, size)
  const lastChunk = address.substr(-(size / 1.5))

  return `${firstChunk}...${lastChunk}`
}

export function formatTokenAmount(amount: Big, denomination = 2): string {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: denomination
  })

  return formatter.format(amount.toNumber())
}

export function makeBNLike(n: BigNumberish | undefined): BNLike | undefined {
  if (n == null) {
    return undefined
  }
  return BigNumber.from(n).toHexString()
}

export const displaySeconds = (timeInSeconds: number): string => {
  return timeInSeconds >= 3600
    ? new Date(timeInSeconds * 1000).toISOString().substr(11, 8) // HH:MM:SS
    : new Date(timeInSeconds * 1000).toISOString().substr(14, 5) // MM:SS
}

/**
 * Used to format large numbers =>
 * values over 1 Million:  32.2M, 1.6B
 * values under 1 Million: as is
 * @param num
 * @param digits - default: 2 - fraction digits to be used by large and normal amounts.
 */
// adapted from: https://stackoverflow.com/a/9462382
export function formatLargeNumber(num: number | string, digits = 2) {
  const number = typeof num === 'number' ? num : Number(num)

  const lookup = [
    { value: 1e9, symbol: 'B' },
    { value: 1e6, symbol: 'M' },
    { value: 1e3, symbol: 'k' }
  ]
  const item = lookup.find(function (it) {
    return number >= it.value
  }) ?? { value: 1, symbol: '' }

  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/
  return (number / item.value).toFixed(digits).replace(rx, '$1') + item.symbol
}

export async function catchAndLog(f: () => Promise<void>, devOnly = true) {
  try {
    await f()
  } catch (e) {
    if (!devOnly || __DEV__) {
      console.error(e)
    }
  }
}
