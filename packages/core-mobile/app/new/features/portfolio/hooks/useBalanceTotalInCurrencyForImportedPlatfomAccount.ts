import { useMemo } from 'react'
import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { useTokensWithBalanceForImportedPlatformAccount } from './useTokensWithBalanceForImportedPlatformAccount'

/**
 * Returns the total balance (in fiat currency) for imported platform account on a given chain
 */
export function useBalanceTotalInCurrencyForImportedPlatformAccount(
  chainId?: number
): number {
  const tokens = useTokensWithBalanceForImportedPlatformAccount(chainId)

  return useMemo(() => {
    return tokens.reduce(
      (acc, token) =>
        acc +
        (isTokenWithBalanceAVM(token) || isTokenWithBalancePVM(token)
          ? token.availableInCurrency ?? 0
          : 0),
      0
    )
  }, [tokens])
}
