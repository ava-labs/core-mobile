import Big from 'big.js'
import { BigNumber } from 'ethers'
import {
  bigToLocaleString,
  ethersBigNumberToBig,
  stringToBN
} from '@avalabs/utils-sdk'
import { TokenType, TokenWithBalance } from 'store/balance'
import { APIError } from 'paraswap'

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

export const formatTimer = (time: number) =>
  `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(
    time % 60
  ).padStart(2, '0')}`

// from https://stackoverflow.com/a/25105589
export function arrayHash(array: string[]) {
  let i,
    sum = 0
  for (i = 0; i < array.length; i++) {
    const cs = charsum(array[i])
    sum = sum + 65027 / cs
  }
  return ('' + sum).slice(0, 16)
}

function charsum(s: string) {
  let i,
    sum = 0
  for (i = 0; i < s.length; i++) {
    sum += s.charCodeAt(i) * (i + 1)
  }
  return sum
}

export function titleToInitials(title: string) {
  return (
    title?.split(' ').reduce((previousValue, currentValue) => {
      return currentValue.length > 0
        ? previousValue + currentValue[0]
        : previousValue
    }, '') ?? ''
  )
}

export function calculateGasAndFees({
  gasPrice,
  tokenPrice,
  tokenDecimals = 18,
  gasLimit
}: {
  gasPrice: BigNumber
  tokenPrice: number
  tokenDecimals?: number
  gasLimit?: number
}) {
  const bnFee = gasLimit ? gasPrice.mul(gasLimit) : gasPrice
  const fee = bigToLocaleString(ethersBigNumberToBig(bnFee, tokenDecimals), 8)
  return {
    gasPrice: gasPrice,
    gasLimit: gasLimit || 0,
    fee,
    bnFee,
    feeInCurrency: parseFloat((parseFloat(fee) * tokenPrice).toFixed(4))
  }
}

export const getMaxValue = (token?: TokenWithBalance, fee?: string) => {
  if (!token || !fee) {
    return
  }

  if (token.type === TokenType.NATIVE) {
    return token.balance.sub(stringToBN(fee, 18))
  }
  return token.balance
}

export function isAPIError(rate: any): rate is APIError {
  return typeof rate?.message === 'string'
}

export async function findAsyncSequential<T>(
  array: T[],
  predicate: (t: T) => Promise<boolean>
): Promise<T | undefined> {
  for (const t of array) {
    if (await predicate(t)) return t
  }
  return undefined
}
