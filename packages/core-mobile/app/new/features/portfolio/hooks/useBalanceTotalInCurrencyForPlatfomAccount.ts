import { useMemo } from 'react'
import { Wallet } from 'store/wallet/types'
import { useTokensWithBalanceForPlatformAccount } from './useTokensWithBalanceForPlatformAccount'

/**
 * Returns the total balance (in fiat currency) for a given wallet on a given chain,
 */
export function useBalanceTotalInCurrencyFoPlatformAccount(
  wallet: Wallet,
  chainId: number
): number {
  const tokens = useTokensWithBalanceForPlatformAccount(wallet, chainId)

  return useMemo(() => {
    if (!wallet) return 0

    return tokens.reduce(
      (acc, token) => acc + (token.balanceInCurrency ?? 0),
      0
    )
  }, [tokens, wallet])
}
