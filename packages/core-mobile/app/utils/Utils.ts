import Big from 'big.js'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import DeviceInfo from 'react-native-device-info'
import { formatNumber } from './formatNumber/formatNumber'

export const truncateAddress = (address: string, size = 6): string => {
  const firstChunk = address.substring(0, size)
  const lastChunk = address.substr(-(size / 1.5))

  return `${firstChunk}...${lastChunk}`
}

export const truncateNodeId = (nodeId: string, size = 6): string => {
  if (size <= 0) {
    return 'NodeID-'
  }

  const firstChunkLength = 'NodeID-'.length + Math.ceil(size / 2)
  const firstChunk = nodeId.substring(0, firstChunkLength)
  const lastChunk = nodeId.slice(firstChunkLength).slice(-Math.floor(size / 2))

  const shouldShowDots =
    lastChunk && lastChunk.length + firstChunk.length !== nodeId.length

  return `${firstChunk}${shouldShowDots ? '…' : ''}${lastChunk}`
}

export function formatTokenAmount(amount: Big, denomination = 2): string {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: denomination
  })

  return formatter.format(amount.toNumber())
}

/**
 * Used to format large numbers that are already formatted with currency =>
 * values over 1 Million:  $32.2M, 1.6B CHF
 * values under 1 Million: as is
 * @param currencyNum
 */
export function formatLargeCurrency(currencyNum: string): string {
  const match = currencyNum.match(/^(-)?([^0-9]+)?([0-9,.]+) ?([A-Z]+)?$/)
  if (!match) return currencyNum
  const [_, negative, symbol, amount, code] = match

  if (amount === undefined) {
    throw Error(`Invalid input ${currencyNum}`)
  }

  const newAmount = formatNumber(amount.replace(/,/g, ''))
  const codeString = code ? ` ${code}` : ''
  return `${negative || ''}${symbol || ''}${newAmount}${codeString}`
}

export const formatTimer = (seconds: number): string =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
    seconds % 60
  ).padStart(2, '0')}`

// from https://stackoverflow.com/a/25105589
export function arrayHash(array: string[]): string {
  let i,
    sum = 0
  for (i = 0; i < array.length; i++) {
    const cs = charsum(array[i] ?? '')
    sum = sum + 65027 / cs
  }
  return ('' + sum).slice(0, 16)
}

function charsum(s: string): number {
  let i,
    sum = 0
  for (i = 0; i < s.length; i++) {
    sum += s.charCodeAt(i) * (i + 1)
  }
  return sum
}

export function titleToInitials(title: string): string {
  return (
    title?.split(' ').reduce((previousValue, currentValue) => {
      return currentValue.length > 0
        ? previousValue + currentValue[0]
        : previousValue
    }, '') ?? ''
  )
}

export type GasAndFees = {
  maxTotalFee: bigint
  maxTotalFeeInCurrency: number
} & Eip1559Fees

export type Eip1559Fees = {
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  gasLimit: number
}

export function calculateGasAndFees({
  maxFeePerGas,
  maxPriorityFeePerGas,
  tokenPrice,
  gasLimit,
  networkTokenDecimals,
  networkTokenSymbol
}: Eip1559Fees & {
  tokenPrice: number
  networkTokenDecimals: number
  networkTokenSymbol: string
}): GasAndFees {
  const maxTotalFee = maxFeePerGas * BigInt(gasLimit)
  const maxFeeInUnit = new TokenUnit(
    maxTotalFee,
    networkTokenDecimals,
    networkTokenSymbol
  )
  return {
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasLimit,
    maxTotalFee,
    maxTotalFeeInCurrency: maxFeeInUnit
      .mul(tokenPrice)
      .toDisplay({ asNumber: true })
  }
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

export const isDebugOrInternalBuild = (): boolean => {
  return __DEV__ || DeviceInfo.getBundleId().includes('.internal')
}
