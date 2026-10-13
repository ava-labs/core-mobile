import { bigIntToString, TokenUnit } from '@avalabs/core-utils-sdk'
import { TokenType } from '@avalabs/vm-module-types'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { MaxUint256 } from 'ethers'
import { Limit, SpendLimit } from 'hooks/useSpendLimits'
import { MarketToken } from 'store/watchlist'
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

/**
 * The headline amount and its fiat line for the spend-limit card.
 *
 * Returns a tuple so the component can destructure it straight into the two
 * `Text` nodes. `amountInCurrency` is `undefined` whenever nothing should be
 * priced, and the card omits the fiat row entirely in that case.
 */
export const getSpendLimitAmounts = ({
  limitType,
  tokenValue,
  tokenDecimals,
  tokenSymbol,
  marketToken,
  isDeveloperMode,
  selectedCurrency,
  formatTokenInCurrency
}: {
  limitType: Limit | undefined
  tokenValue: bigint | undefined
  tokenDecimals: number
  tokenSymbol: string | undefined
  marketToken: MarketToken | undefined
  isDeveloperMode: boolean
  selectedCurrency: string
  formatTokenInCurrency: (props: { amount: number }) => string
}): [amount: string, amountInCurrency: string | undefined] => {
  if (
    limitType === Limit.UNLIMITED ||
    (tokenValue !== undefined && tokenValue >= MAX_UINT256)
  ) {
    // Testnet funds have no market value, so the fiat label goes away with
    // every other fiat value in developer mode (CP-15076).
    return ['∞', isDeveloperMode ? undefined : `Unlimited ${selectedCurrency}`]
  }

  if (!tokenValue || !tokenDecimals || !tokenSymbol) {
    return [UNKNOWN_AMOUNT, undefined]
  }

  const amountToDisplay = new TokenUnit(
    tokenValue,
    tokenDecimals,
    tokenSymbol
  ).toDisplay()

  if (!marketToken?.currentPrice) {
    return [amountToDisplay, undefined]
  }

  const amountInCurrency = formatTokenInCurrency({
    amount:
      Number(bigIntToString(tokenValue, tokenDecimals)) *
      marketToken.currentPrice
  })

  return [amountToDisplay, `${amountInCurrency} ${selectedCurrency}`]
}
