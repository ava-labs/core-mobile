import { useEffect, useMemo, useRef, useState } from 'react'
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
  const { data, isLoading, isRefetching, isError, isOffline } =
    useAccountBalances(account, options)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const enabledChainIds = useSelector(selectEnabledChainIds)
  const networks = useSelector(selectEnabledNetworksMap)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  // Safety valve: accept partial data after 15 s to prevent an
  // infinite loading screen if a chain is permanently unreachable.
  const [acceptPartial, setAcceptPartial] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const hasPartialData = data !== undefined && data.length > 0 && isLoading

    if (hasPartialData && !acceptPartial) {
      timerRef.current = setTimeout(() => setAcceptPartial(true), 15_000)
    } else if (!isLoading && acceptPartial) {
      setAcceptPartial(false)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [data, isLoading, acceptPartial])

  return useMemo(() => {
    if (!account || !data) {
      return {
        isAllBalancesInaccurate: false,
        isBalanceLoaded: false,
        isAllBalancesError: false,
        isLoading: false,
        isPolling: false,
        isRefetching: false,
        totalBalanceInCurrency: 0
      }
    }

    // Consider balances "loaded" when:
    // - we have data AND all networks have responded (!isLoading), OR
    // - the 15 s safety timer accepted partial data, OR
    // - we are confirmed offline.
    // This prevents showing tokens in two waves (e.g. BTC/XP first, then
    // EVM/SOL seconds later) on iOS after reconnecting from offline.
    const isBalanceLoaded =
      (data.length > 0 && (!isLoading || acceptPartial)) || isOffline

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
      isLoading,
      isPolling: false,
      isRefetching,
      // Suppress partial totals until all chains have reported so the
      // header doesn't jump from a BTC/XP-only amount to the full amount.
      totalBalanceInCurrency: isBalanceLoaded ? totalBalanceInCurrency : 0
    }
  }, [
    account,
    data,
    isLoading,
    isRefetching,
    isError,
    isOffline,
    acceptPartial,
    tokenVisibility,
    enabledChainIds,
    networks,
    isDeveloperMode
  ])
}
