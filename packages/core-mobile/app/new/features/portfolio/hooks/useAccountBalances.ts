import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import BalanceService from 'services/balance/BalanceService'
import { AdjustedNormalizedBalancesForAccount } from 'services/balance/types'
import { Account } from 'store/account/types'
import { enableChainId, selectEnabledNetworks } from 'store/network/slice'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import { Network } from '@avalabs/core-chains-sdk'
import { useXPAddresses } from 'hooks/useXPAddresses/useXPAddresses'
import { selectWalletById } from 'store/wallet/slice'
import { getXpubXPIfAvailable } from 'utils/getAddressesFromXpubXP/getAddressesFromXpubXP'
import { useNetInfo } from '@react-native-community/netinfo'
import { useSupportedChains } from 'features/swap/hooks/useSupportedChains'
import { selectHasBeenViewedOnce, setViewOnce } from 'store/viewOnce/slice'
import { ViewOnceKey } from 'store/viewOnce/types'
import * as store from '../store'

/**
 * Stale time in milliseconds
 */
const staleTime = 20_000

/**
 * Refetch interval in milliseconds:
 * - 30 seconds in dev mode
 * - 5 seconds in prod mode
 */
const refetchInterval = __DEV__ ? 30_000 : 5_000

export const balanceKey = (account: Account | undefined, network?: Network[]) =>
  [
    ReactQueryKeys.ACCOUNT_BALANCE,
    account?.id,
    network
      ?.map(n => n.chainId)
      .sort()
      .join(',')
  ] as const

/**
 * Fetches balances for the specified account across all enabled networks (C-Chain, X-Chain, P-Chain, other EVMs, BTC, SOL, etc.)
 *
 * 🔁 Runs one query for all enabled networks via React Query.
 */
export function useAccountBalances(
  account?: Account,
  options?: {
    refetchInterval?: number | false
  }
): {
  data: AdjustedNormalizedBalancesForAccount[]
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  isPaused: boolean
  isOffline: boolean
  isRefetching: boolean
  refetch: () => Promise<void>
} {
  const queryClient = useQueryClient()
  const [isRefetching, setIsRefetching] = store.useIsRefetchingAccountBalances()
  const netInfo = useNetInfo()
  // isConnected is false only when the device has no network interface at all
  // (airplane mode, WiFi+cellular both off). We intentionally skip
  // isInternetReachable here because it can be false on working networks
  // when the reachability check host is blocked or slow (VPN, captive portals).
  const isOnline = netInfo.isConnected !== false

  const dispatch = useDispatch()
  const enabledNetworks = useSelector(selectEnabledNetworks)
  const hasAutoEnabledSwapNetworks = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.AUTO_ENABLE_SWAP_NETWORKS)
  )
  const currency = useSelector(selectSelectedCurrency)
  const { xpAddresses } = useXPAddresses(account)
  const wallet = useSelector(selectWalletById(account?.walletId ?? ''))
  const { allChains } = useSupportedChains()

  // Include all swap-supported networks so their balances are pre-fetched and
  // cached before the user opens ManageNetworks or triggers auto-enable logic.
  const networksToFetch = useMemo(() => {
    if (!allChains || allChains.length === 0) return enabledNetworks
    const enabledSet = new Set(enabledNetworks.map(n => n.chainId))
    const extraNetworks = allChains.filter(n => !enabledSet.has(n.chainId))
    return [...enabledNetworks, ...extraNetworks]
  }, [enabledNetworks, allChains])

  const enabledNetworkIds = useMemo(
    () => new Set(enabledNetworks.map(n => n.chainId)),
    [enabledNetworks]
  )

  const isNotReady = !account || networksToFetch.length === 0 || !wallet

  const enabled = !isNotReady

  const {
    data,
    isFetching,
    isError,
    isPaused,
    refetch: refetchFn
  } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: balanceKey(account, networksToFetch),
    enabled,
    refetchInterval: options?.refetchInterval ?? refetchInterval,
    staleTime,
    queryFn: async () => {
      if (isNotReady) return []

      const xpub = await getXpubXPIfAvailable({
        walletId: wallet.id,
        walletType: wallet.type,
        accountIndex: account.index
      })

      return BalanceService.getBalancesForAccount({
        networks: networksToFetch,
        account,
        currency: currency.toLowerCase(),
        xpAddresses,
        xpub,
        onBalanceLoaded: balance => {
          queryClient.setQueryData(
            balanceKey(account, networksToFetch),
            (prev: AdjustedNormalizedBalancesForAccount[] | undefined) => {
              if (!prev) return [balance]
              const filtered = prev.filter(p => p.chainId !== balance.chainId)
              return [...filtered, balance]
            }
          )
          // Auto-enable disabled swap networks that have balance — once per login only.
          // hasAutoEnabledSwapNetworks is cleared on logout so this re-runs next login,
          // but won't re-enable networks the user deliberately disables afterwards.
          if (
            !hasAutoEnabledSwapNetworks &&
            !enabledNetworkIds.has(balance.chainId) &&
            balance.tokens.some(t => t.balance > 0n)
          ) {
            dispatch(enableChainId(balance.chainId))
            // Mark auto-enable as done for this login session after all balances have loaded.
            dispatch(setViewOnce(ViewOnceKey.AUTO_ENABLE_SWAP_NETWORKS))
          }
        }
      })
    }
  })

  const refetch = useCallback(async (): Promise<void> => {
    if (isNotReady) return

    setIsRefetching(prev => ({ ...prev, [account.id]: true }))

    try {
      if (!isOnline) {
        // Yield to the event loop so the spinner renders before we clear it.
        // Without this, React 18 batches the true→false updates into one render.
        await new Promise<void>(resolve => setTimeout(resolve, 300))
        return
      }
      await refetchFn()
    } finally {
      setIsRefetching(prev => ({ ...prev, [account.id]: false }))
    }
  }, [isNotReady, isOnline, account?.id, setIsRefetching, refetchFn])

  const isLoading = useMemo(() => {
    if (isError || !isOnline) return false

    // still loading if:
    // - account missing, OR
    // - no data, OR
    // - fewer results than enabled networks
    return (
      !account ||
      !data ||
      data.length === 0 ||
      data.length < enabledNetworks.length
    )
  }, [account, data, enabledNetworks.length, isError, isOnline])

  return {
    data: data ?? [],
    isLoading,
    isFetching,
    isError,
    isPaused,
    isOffline: !isOnline,
    isRefetching: isRefetching[account?.id ?? ''] ?? false,
    refetch
  }
}
