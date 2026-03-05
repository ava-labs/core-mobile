import { TokenUnit } from '@avalabs/core-utils-sdk'
import { TokenType } from '@avalabs/vm-module-types'
import { MaxUint256 } from 'ethers'
import { Limit, SpendLimit } from 'hooks/useSpendLimits'
import { hexToBigInt } from 'viem'

const MAX_UINT256 = BigInt(MaxUint256.toString())

const formatTokenAmount = (
  value: bigint,
  decimals: number,
  symbol: string
): string =>
  value >= MAX_UINT256
    ? 'Unlimited'
    : new TokenUnit(value, decimals, symbol).toDisplay()

export const getDefaultSpendLimitValue = (
  spendLimit: SpendLimit
): string | undefined => {
  const token = spendLimit.tokenApproval.token

  if (token.type !== TokenType.ERC20) {
    return undefined
  }

  if (spendLimit?.tokenApproval?.value) {
    const value = hexToBigInt(spendLimit.tokenApproval.value as `0x${string}`)
    return formatTokenAmount(value, token.decimals, token.symbol)
  }
}

export const getSpendLimitValueBasedOnCurrentLimitType = (
  spendLimit: SpendLimit
): string | undefined => {
  const token = spendLimit.tokenApproval.token

  if (token.type !== TokenType.ERC20) {
    return undefined
  }

  if (spendLimit.limitType === Limit.UNLIMITED) {
    return 'Unlimited'
  }

  if (
    spendLimit.limitType === Limit.DEFAULT &&
    spendLimit?.tokenApproval?.value
  ) {
    const value = hexToBigInt(spendLimit.tokenApproval.value as `0x${string}`)
    return formatTokenAmount(value, token.decimals, token.symbol)
  }

  if (spendLimit.limitType === Limit.CUSTOM && spendLimit?.value?.bn) {
    return formatTokenAmount(spendLimit.value.bn, token.decimals, token.symbol)
  }
}

const splitBN = (val: string): (string | null)[] => {
  return val.includes('.') ? val.split('.') : [val, null]
}

export const sanitizeAmountInput = (
  rawValue: string,
  denomination: number
): string => {
  if (!rawValue) return ''

  // 1. Remove all illegal characters (keep only digits and dots)
  let cleaned = rawValue.replace(/[^\d.]/g, '')

  // 2. Only keep the first dot (remove extra dots)
  const firstDotIndex = cleaned.indexOf('.')
  if (firstDotIndex !== -1) {
    cleaned =
      cleaned.slice(0, firstDotIndex + 1) +
      cleaned.slice(firstDotIndex + 1).replace(/\./g, '')
  }

  // 3. Add leading zero if starts with '.'
  if (cleaned.startsWith('.')) {
    cleaned = '0' + cleaned
  }

  // 4. Limit decimal places if needed
  const [, decimals] = splitBN(cleaned)
  if (decimals && decimals.length > denomination) {
    const [integerPart] = cleaned.split('.')
    cleaned = `${integerPart}.${decimals.slice(0, denomination)}`
  }

  return cleaned
}
