import { useMemo } from 'react'
import { selectEnabledChainIds } from 'store/network'
import { isTokenVisible } from 'store/balance/utils'
import { selectTokenVisibility } from 'store/portfolio'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { Wallet } from 'store/wallet/types'
import { useTokensWithBalanceForWallet } from './useTokensWithBalanceForWallet'

/**
 * Returns the total balance (in fiat currency) for a given wallet,
 * filtered by token visibility and enabled networks.
 */
export function useBalanceTotalInCurrencyForWallet(wallet?: Wallet): number {
  const tokenVisibility = useFocusedSelector(selectTokenVisibility)
  const enabledChainIds = useFocusedSelector(selectEnabledChainIds)
  const tokens = useTokensWithBalanceForWallet(wallet)

  return useMemo(() => {
    if (!wallet) return 0

    return tokens
      .filter(
        token =>
          isTokenVisible(tokenVisibility, token) &&
          enabledChainIds.includes(token.networkChainId)
      )
      .reduce((acc, token) => acc + (token.balanceInCurrency ?? 0), 0)
  }, [wallet, tokens, tokenVisibility, enabledChainIds])
}
