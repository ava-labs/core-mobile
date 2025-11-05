import { useMemo } from 'react'
import { selectEnabledChainIds } from 'store/network'
import { isTokenVisible } from 'store/balance/utils'
import { selectTokenVisibility } from 'store/portfolio'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { Account } from 'store/account'
import { useTokensWithBalanceForAccount } from './useTokensWithBalanceForAccount'

/**
 * Returns the total balance (in fiat currency) for a given account,
 * filtered by token visibility and enabled networks.
 */
export function useBalanceTotalInCurrencyForAccount(account?: Account): number {
  const tokenVisibility = useFocusedSelector(selectTokenVisibility)
  const enabledChainIds = useFocusedSelector(selectEnabledChainIds)
  const tokens = useTokensWithBalanceForAccount(account)

  return useMemo(() => {
    if (!account) return 0

    return tokens
      .filter(
        token =>
          isTokenVisible(tokenVisibility, token) &&
          enabledChainIds.includes(token.networkChainId)
      )
      .reduce((acc, token) => acc + (token.balanceInCurrency ?? 0), 0)
  }, [tokens, tokenVisibility, enabledChainIds, account])
}
