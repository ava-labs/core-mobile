import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { AdjustedNormalizedBalancesForAccount } from 'services/balance/types'
import {
  selectEnabledChainIds,
  selectEnabledNetworks,
  selectEnabledNetworksMap
} from 'store/network/slice'
import { selectTokenVisibility } from 'store/portfolio'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import {
  computeAccountBalance,
  AccountBalanceData
} from 'features/portfolio/utils/computeAccountBalance'

/**
 * Hook wrapper around computeAccountBalance.
 * Subscribes to Redux selectors internally — use only when
 * a parent cannot pre-compute (e.g. SelectAccounts).
 */
export const useBalanceInCurrencyForAccount = (
  accountBalances: AdjustedNormalizedBalancesForAccount[],
  isError: boolean
): AccountBalanceData => {
  const enabledNetworks = useSelector(selectEnabledNetworks)
  const enabledNetworksMap = useSelector(selectEnabledNetworksMap)
  const enabledChainIds = useFocusedSelector(selectEnabledChainIds)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const tokenVisibility = useFocusedSelector(selectTokenVisibility)

  return useMemo(
    () =>
      computeAccountBalance({
        accountBalances,
        enabledNetworksCount: enabledNetworks.length,
        enabledNetworksMap,
        enabledChainIds,
        isDeveloperMode,
        tokenVisibility,
        isError
      }),
    [
      accountBalances,
      enabledNetworks.length,
      enabledNetworksMap,
      enabledChainIds,
      isDeveloperMode,
      tokenVisibility,
      isError
    ]
  )
}
