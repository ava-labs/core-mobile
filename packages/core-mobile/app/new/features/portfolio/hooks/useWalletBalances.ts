import { skipToken, useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  AdjustedNormalizedBalancesForAccount,
  AdjustedNormalizedBalancesForAccounts
} from 'services/balance/types'
import { selectEnabledNetworks } from 'store/network/slice'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import { selectIsFilterSmallUtxosActive } from 'store/settings/advanced/filterSmallUtxosActive'
import { balancesKey } from './useAccountsBalances'

const emptyBalances: AdjustedNormalizedBalancesForAccount[] = []

/**
 * Observes the shared balances cache and returns only the data
 * for the given account IDs. Uses React Query `select` so the
 * component only re-renders when its own slice of data changes.
 *
 * Does NOT fetch — relies on useAllBalances() being active elsewhere.
 */
export function useWalletBalances(accountIds: string[]): {
  data: AdjustedNormalizedBalancesForAccounts
  isError: boolean
} {
  const enabledNetworks = useSelector(selectEnabledNetworks)
  const currency = useSelector(selectSelectedCurrency)
  const filterOutDustUtxos = useSelector(selectIsFilterSmallUtxosActive)

  const enabledChainIdsKey = useMemo(
    () =>
      enabledNetworks
        .map(n => n.chainId)
        .sort((a, b) => a - b)
        .join(','),
    [enabledNetworks]
  )

  const queryKey = useMemo(
    () => balancesKey({ currency, enabledChainIdsKey, filterOutDustUtxos }),
    [currency, enabledChainIdsKey, filterOutDustUtxos]
  )

  const select = useCallback(
    (
      allData: AdjustedNormalizedBalancesForAccounts
    ): AdjustedNormalizedBalancesForAccounts => {
      const result: AdjustedNormalizedBalancesForAccounts = {}
      for (const id of accountIds) {
        result[id] = allData[id] ?? emptyBalances
      }
      return result
    },
    [accountIds]
  )

  const { data, isError } = useQuery({
    queryKey,
    queryFn: skipToken,
    select
  })

  return { data: data ?? {}, isError }
}
