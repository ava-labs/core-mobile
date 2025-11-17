import { useMemo } from 'react'
import { selectEnabledChainIds } from 'store/network'
import { isTokenVisible } from 'store/balance/utils'
import { selectTokenVisibility } from 'store/portfolio'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { Account } from 'store/account'
import { NormalizedBalancesForAccount } from 'services/balance/types'
import { useTokensWithBalanceForAccount } from './useTokensWithBalanceForAccount'

/**
 * Returns the total balance (in fiat currency) for a given account,
 * filtered by token visibility and enabled networks.
 *
 * Notes: when source data is provided, it will be used instead of data from useAccountBalances
 */
export function useBalanceTotalInCurrencyForAccount({
  account,
  sourceData
}: {
  account?: Account
  sourceData?: NormalizedBalancesForAccount[]
}): number {
  const tokenVisibility = useFocusedSelector(selectTokenVisibility)
  const enabledChainIds = useFocusedSelector(selectEnabledChainIds)
  const tokens = useTokensWithBalanceForAccount({ account, sourceData })

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
