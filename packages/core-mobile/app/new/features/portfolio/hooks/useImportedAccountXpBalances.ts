import { useCallback, useMemo } from 'react'
import {
  QueryObserverResult,
  useQueries,
  useQueryClient
} from '@tanstack/react-query'
import BalanceService from 'services/balance/BalanceService'
import { NormalizedBalancesForXpAddress } from 'services/balance/types'
import { useSelector } from 'react-redux'
import { selectEnabledNetworks } from 'store/network/slice'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import { selectImportedAccounts } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import { getAddressesForXP } from 'store/account/utils'
import { Network } from '@avalabs/core-chains-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID } from 'features/accountSettings/consts'
import { selectImportedWallets } from 'store/wallet/slice'
import { WalletType } from 'services/wallet/types'
import * as store from '../store'
import { getFetchingInterval, isXpNetwork } from './utils'

/**
 * Stale time in milliseconds
 */
const staleTime = 60_000 // 1 minute

export const balanceKey = (network: Network) =>
  [
    ReactQueryKeys.IMPORTED_ACCOUNT_XP_BALANCE,
    IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID,
    WalletType.PRIVATE_KEY,
    network.chainId
  ] as const

/**
 * Fetches balances for all XP networks (P-Chain and X-Chain)
 * across all addresses (with activities) within the imported accounts.
 *
 * 🔁 Runs one query per XP network in parallel via React Query.
 * 🕒 Auto-refresh cadence: every 5 minutes.
 */
export function useImportedAccountXpBalances(chainId?: number): {
  results: QueryObserverResult<
    Record<string, NormalizedBalancesForXpAddress>,
    Error
  >[]
  refetch: () => Promise<void>
  isRefetching: boolean
} {
  const importedWallets = useSelector(selectImportedWallets)
  const queryClient = useQueryClient()
  const [isRefetching, setIsRefetching] =
    store.useIsRefetchingWalletXpBalances()
  const enabledNetworks = useSelector(selectEnabledNetworks)
  const currency = useSelector(selectSelectedCurrency)
  const accounts = useSelector(selectImportedAccounts)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const xpNetworks = useMemo(() => {
    const filtered = enabledNetworks.filter(isXpNetwork)
    if (chainId) {
      return filtered.filter(network => network.chainId === chainId)
    }
    return filtered
  }, [enabledNetworks, chainId])

  const queries = useMemo(() => {
    if (
      importedWallets.length === 0 ||
      accounts.length === 0 ||
      xpNetworks.length === 0
    )
      return []

    return xpNetworks.map(network => ({
      queryKey: balanceKey(network),
      queryFn: async (): Promise<
        Record<string, NormalizedBalancesForXpAddress>
      > => {
        const resolvedAddresses = await Promise.all(
          importedWallets.map(wallet =>
            getAddressesForXP({
              networkType: network.vmName,
              isDeveloperMode,
              walletId: wallet.id,
              walletType: wallet.type,
              onlyWithActivity: true
            })
          )
        )
        const addresses = resolvedAddresses.flat()
        return BalanceService.getPlatformAccountBalances({
          network,
          currency: currency.toLowerCase(),
          addresses
        })
      },
      refetchInterval: getFetchingInterval(network),
      staleTime
    }))
  }, [xpNetworks, importedWallets, accounts, currency, isDeveloperMode])

  const results = useQueries({ queries })

  /**
   * Manually refetch all XP network balances.
   */
  const refetch = useCallback(async (): Promise<void> => {
    if (
      importedWallets.length === 0 ||
      accounts.length === 0 ||
      xpNetworks.length === 0
    )
      return

    setIsRefetching(prev => ({
      ...prev,
      [IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID]: true
    }))

    try {
      await Promise.allSettled(
        xpNetworks.map(network =>
          queryClient.refetchQueries({
            queryKey: balanceKey(network)
          })
        )
      )
    } finally {
      setIsRefetching(prev => ({
        ...prev,
        [IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID]: false
      }))
    }
  }, [
    xpNetworks,
    importedWallets,
    accounts.length,
    queryClient,
    setIsRefetching
  ])

  return {
    results,
    refetch,
    isRefetching: isRefetching[IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID] ?? false
  }
}
