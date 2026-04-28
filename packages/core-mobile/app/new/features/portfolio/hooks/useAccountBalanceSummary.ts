import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Account } from 'store/account'
import { selectEnabledChainIds, selectEnabledNetworksMap } from 'store/network'
import { selectTokenVisibility } from 'store/portfolio'
import { isTokenVisible } from 'store/balance/utils'
import { isDefined } from 'new/common/utils/isDefined'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useAccountBalances } from './useAccountBalances'

export type AccountBalanceSummary = {
  isAllBalancesInaccurate: boolean
  isBalanceLoaded: boolean
  isAllBalancesError: boolean
  isFetching: boolean
  isLoading: boolean
  isPolling: boolean
  isRefetching: boolean
  totalBalanceInCurrency: number
}

export function useAccountBalanceSummary(
  account?: Account,
  options?: {
    refetchInterval?: number | false
  }
): AccountBalanceSummary {
  const { data, isLoading, isFetching, isRefetching, isError, isOffline } =
    useAccountBalances(account, options)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const enabledChainIds = useSelector(selectEnabledChainIds)
  const networks = useSelector(selectEnabledNetworksMap)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  return useMemo(() => {
    if (!account || !data) {
      return {
        isAllBalancesInaccurate: false,
        isBalanceLoaded: false,
        isAllBalancesError: false,
        isFetching: false,
        isLoading: false,
        isPolling: false,
        isRefetching: false,
        totalBalanceInCurrency: 0
      }
    }

    const isBalanceLoaded = data.length > 0 || isError || isOffline

    const isAllBalancesInaccurate =
      data.length > 0 && data.every(balance => balance.dataAccurate === false)
    const isAllBalancesError =
      isError ||
      isOffline ||
      (data.length > 0 && data.every(balance => balance.error != null))

    // Calculate total balance
    const balancesForAccount = data.filter(
      balance => balance.accountId === account.id
    )

    const filteredBalances = balancesForAccount
      .filter(isDefined)
      .filter(balance => {
        const network = networks[balance.chainId]
        const isTestnet = network?.isTestnet
        return (
          (isDeveloperMode && isTestnet) || (!isDeveloperMode && !isTestnet)
        )
      })

    const tokens = filteredBalances.flatMap(balance => balance.tokens)

    const totalBalanceInCurrency = tokens
      .filter(
        token =>
          // @ts-ignore
          isTokenVisible(tokenVisibility, token) &&
          enabledChainIds.includes(token.networkChainId)
      )
      .reduce((acc, token) => acc + (token.balanceInCurrency ?? 0), 0)

    return {
      isAllBalancesInaccurate,
      isBalanceLoaded,
      isAllBalancesError,
      isFetching,
      isLoading,
      isPolling: false,
      isRefetching,
      totalBalanceInCurrency
    }
  }, [
    account,
    data,
    isFetching,
    isLoading,
    isRefetching,
    isError,
    isOffline,
    tokenVisibility,
    enabledChainIds,
    networks,
    isDeveloperMode
  ])
}
