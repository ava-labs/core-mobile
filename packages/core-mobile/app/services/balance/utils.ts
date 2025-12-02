import {
  type TokenWithBalance,
  NetworkContractToken,
  TokenType
} from '@avalabs/vm-module-types'
import { EvmGetBalancesResponse } from 'utils/apiClient/generated/balanceApi.client'
import { NormalizedBalancesForAccount } from './types'
import { LocalTokenWithBalance } from 'store/balance/types'
import { Erc20TokenBalance } from '@avalabs/glacier-sdk'

export function getLocalTokenId(
  token: TokenWithBalance | NetworkContractToken
): string {
  if (token.type === TokenType.NATIVE) {
    return `${token.type}-${token.symbol}`
  }

  return token.address
}

/**
 * Convert raw new balance API response → old Core Mobile balance format
 */
export function mapRawBalanceToOld(
  raw: EvmGetBalancesResponse
): Record<string, NormalizedBalancesForAccount> {
  // -----------------------------
  // 1. Normalize raw → normalized
  // -----------------------------
  const [_, chainIdStr] = raw.caip2Id.split(':')

  const normalizedTokens = [
    // Native
    {
      ...raw.balances.nativeTokenBalance,
      type: 'native'
    },

    // ERC20s
    ...raw.balances.erc20TokenBalances.map(t => ({
      ...t,
      type: 'erc20'
    }))
  ]

  const normalized = {
    chainId: Number(chainIdStr),
    accountAddress: raw.id,
    tokens: normalizedTokens,
    dataAccurate: true,
    error: raw.error ?? null
  }

  // -----------------------------
  // Helper formatters (old API style)
  // -----------------------------
  const formatDisplayValue = (
    balance: string,
    decimals: number,
    maxDecimalsShown = 6
  ): string => {
    const value = Number(balance) / 10 ** decimals
    return value.toFixed(maxDecimalsShown).replace(/0+$/, '').replace(/\.$/, '')
  }

  const formatCurrencyDisplay = (amount?: number): string =>
    amount != null ? amount.toFixed(2) : '0.00'

  // -----------------------------
  // 2. Normalized → old format
  // -----------------------------
  const output: Record<string, NormalizedBalancesForAccount> = {}
  const accountTokens: Record<string, LocalTokenWithBalance> = {}

  for (const token of normalized.tokens) {
    const isNative = token.type === 'native'

    const tokenAddress = 'address' in token ? token.address : undefined

    const key = isNative ? token.symbol : tokenAddress

    if (!key) continue

    const balanceDisplayValue = formatDisplayValue(
      token.balance,
      token.decimals
    )

    const balanceCurrencyDisplayValue = formatCurrencyDisplay(
      token.balanceInCurrency
    )

    accountTokens[key] = {
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      type: isNative ? TokenType.NATIVE : TokenType.ERC20,
      logoUri: token.logoUri,
      balance: BigInt(token.balance),
      balanceDisplayValue,
      balanceInCurrency: token.balanceInCurrency,
      balanceCurrencyDisplayValue,
      priceInCurrency: token.price,
      reputation:
        'scanResult' in token
          ? (token.scanResult as Erc20TokenBalance.tokenReputation)
          : null,
      ...(isNative ? {} : { address: tokenAddress }),
      ...(isNative ? {} : { chainId: normalized.chainId }),

      // Legacy fields (not in new API)
      marketCap: 0,
      vol24: 0,
      change24: token.priceChangePercentage24h ?? 0
    }
  }

  output[normalized.accountAddress] = {
    accountId: normalized.accountAddress,
    chainId: normalized.chainId,
    accountAddress: normalized.accountAddress,
    tokens: Object.values(accountTokens),
    dataAccurate: true,
    error: null
  }
  return output
}
