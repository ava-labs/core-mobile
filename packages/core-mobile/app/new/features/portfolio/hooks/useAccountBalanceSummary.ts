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

    // `useAccountBalances`' own `isLoading` already resolves to `false` once
    // that hook's fetch attempt has settled (including the "some network
    // never reported back" edge case — see its comment), so folding `!isLoading`
    // in here keeps this looser "got at least one balance" formula from being
    // the one thing still holding the loading gate open in that same edge case.
    const isBalanceLoaded =
      data.length > 0 || isError || isOffline || !isLoading

    const isAllBalancesInaccurate =
      data.length > 0 && data.every(balance => balance.dataAccurate === false)
    const isAllBalancesError =
      isError ||
      isOffline ||
      (data.length > 0 && data.every(balance => balance.error != null)) ||
      // Every enabled network can — in the same silent-drop edge case that
      // makes `useAccountBalances` latch `isLoading` false without full data
      // (see its comment) — end up with ZERO entries in `data`: no success,
      // no per-network error object, nothing. `isBalanceLoaded` above still
      // needs to flip true here so we don't spin forever, but without this
      // clause that reads as "loaded and confirmed empty", which renders a
      // confident "you have no assets" empty state for what may be a funded
      // wallet that simply failed to load. Route it to the error state
      // instead. Legitimate zero-balance wallets don't hit this: every
      // successfully-resolved network still contributes one entry (even with
      // an empty token list), so `data.length` only reads 0 when nothing
      // resolved at all.
      (!isLoading && data.length === 0)

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
