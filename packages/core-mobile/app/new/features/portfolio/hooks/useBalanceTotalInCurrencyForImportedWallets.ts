import { useMemo } from 'react'
import { selectEnabledChainIds } from 'store/network'
import { isTokenVisible } from 'store/balance/utils'
import { selectTokenVisibility } from 'store/portfolio'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { selectImportedWallets } from 'store/wallet/slice'
import { useSelector } from 'react-redux'
import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { useTokensWithBalanceForImportedWallets } from './useTokensWithBalanceForImportedWallets'

/**
 * Returns the total balance (in fiat currency) for imported wallets,
 * filtered by token visibility and enabled networks.
 */
export function useBalanceTotalInCurrencyForImportedWallets(): number {
  const tokenVisibility = useFocusedSelector(selectTokenVisibility)
  const enabledChainIds = useFocusedSelector(selectEnabledChainIds)
  const { accountTokens, platformTokens } =
    useTokensWithBalanceForImportedWallets()
  const importedWallets = useSelector(selectImportedWallets)

  const accountTokensBalance = useMemo(() => {
    if (importedWallets.length === 0) return 0

    return accountTokens
      .filter(
        token =>
          isTokenVisible(tokenVisibility, token) &&
          enabledChainIds.includes(token.networkChainId)
      )
      .reduce((acc, token) => acc + (token.balanceInCurrency ?? 0), 0)
  }, [importedWallets.length, accountTokens, tokenVisibility, enabledChainIds])

  const platformTokensBalance = useMemo(() => {
    return platformTokens.reduce(
      (acc, token) =>
        acc +
        (isTokenWithBalanceAVM(token) || isTokenWithBalancePVM(token)
          ? token.availableInCurrency ?? 0
          : 0),
      0
    )
  }, [platformTokens])

  return accountTokensBalance + platformTokensBalance
}
