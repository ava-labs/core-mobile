import { useMemo } from 'react'
import { selectEnabledChainIds } from 'store/network'
import { isTokenVisible } from 'store/balance/utils'
import { selectTokenVisibility } from 'store/portfolio'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { selectImportedWallets } from 'store/wallet/slice'
import { useSelector } from 'react-redux'
import { useTokensWithBalanceForImportedAccounts } from './useTokensWithBalanceForImportedAccounts'

/**
 * Returns the total balance (in fiat currency) for imported accounts,
 * filtered by token visibility and enabled networks.
 */
export function useBalanceTotalInCurrencyForImportedAccounts(): number {
  const tokenVisibility = useFocusedSelector(selectTokenVisibility)
  const enabledChainIds = useFocusedSelector(selectEnabledChainIds)
  const tokens = useTokensWithBalanceForImportedAccounts()
  const importedWallets = useSelector(selectImportedWallets)

  return useMemo(() => {
    if (importedWallets.length === 0) return 0

    return tokens
      .filter(
        token =>
          isTokenVisible(tokenVisibility, token) &&
          enabledChainIds.includes(token.networkChainId)
      )
      .reduce((acc, token) => acc + (token.balanceInCurrency ?? 0), 0)
  }, [importedWallets, tokens, tokenVisibility, enabledChainIds])
}
