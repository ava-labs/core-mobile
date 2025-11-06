import { useMemo } from 'react'
import { Wallet } from 'store/wallet/types'
import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { useTokensWithBalanceForPlatformAccount } from './useTokensWithBalanceForPlatformAccount'

/**
 * Returns the total balance (in fiat currency) for a given wallet on a given chain,
 */
export function useBalanceTotalInCurrencyForPlatformAccount(
  wallet: Wallet,
  chainId?: number
): number {
  const tokens = useTokensWithBalanceForPlatformAccount(wallet, chainId)

  return useMemo(() => {
    if (!wallet) return 0

    return tokens.reduce(
      (acc, token) =>
        acc +
        (isTokenWithBalanceAVM(token) || isTokenWithBalancePVM(token)
          ? token.availableInCurrency ?? 0
          : 0),
      0
    )
  }, [tokens, wallet])
}
