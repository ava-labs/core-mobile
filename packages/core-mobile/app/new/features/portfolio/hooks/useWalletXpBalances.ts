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
import { selectAccountsByWalletId } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import { getAddressesForXP } from 'store/account/utils'
import { WalletType } from 'services/wallet/types'
import { Network } from '@avalabs/core-chains-sdk'
import { NetworkVMType } from '@avalabs/vm-module-types'
import { RootState } from 'store/types'
import { Wallet } from 'store/wallet/types'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import * as store from '../store'
import { getFetchingInterval, isXpNetwork } from './utils'

/**
 * Stale time in milliseconds
 */
const staleTime = 60_000 // 1 minute

const balanceKey = (wallet: Wallet, network: Network) =>
  [
    ReactQueryKeys.WALLET_XP_BALANCE,
    wallet.id,
    wallet.type,
    network.chainId
  ] as const

/**
 * Fetches balances for all XP networks (P-Chain and X-Chain)
 * across all addresses (with activities) within the specified wallet.
 *
 * 🔁 Runs one query per XP network in parallel via React Query.
 * 🕒 Auto-refresh cadence: every 5 minutes.
 */
export function useWalletXpBalances(wallet?: Wallet): {
  results: QueryObserverResult<
    Record<string, NormalizedBalancesForXpAddress>,
    Error
  >[]
  refetch: () => Promise<void>
  isRefetching: boolean
} {
  const walletId = wallet?.id ?? ''
  const queryClient = useQueryClient()
  const [isRefetching, setIsRefetching] =
    store.useIsRefetchingWalletXpBalances()
  const enabledNetworks = useSelector(selectEnabledNetworks)
  const currency = useSelector(selectSelectedCurrency)
  const accounts = useSelector((state: RootState) =>
    selectAccountsByWalletId(state, walletId)
  )
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const xpNetworks = useMemo(
    () => enabledNetworks.filter(isXpNetwork),
    [enabledNetworks]
  )

  const queries = useMemo(() => {
    if (!wallet || accounts.length === 0 || xpNetworks.length === 0) return []

    return xpNetworks.map(network => ({
      queryKey: balanceKey(wallet, network),
      queryFn: async (): Promise<
        Record<string, NormalizedBalancesForXpAddress>
      > => {
        let addresses: string[] = []

        if (wallet.type === WalletType.SEEDLESS) {
          addresses = Object.values(accounts).map(a =>
            network.vmName === NetworkVMType.PVM ? a.addressPVM : a.addressAVM
          )
        } else {
          addresses = await getAddressesForXP({
            networkType: network.vmName,
            isDeveloperMode,
            walletId,
            walletType: wallet.type,
            onlyWithActivity: true
          })
        }

        return BalanceService.getXPBalances({
          network,
          currency: currency.toLowerCase(),
          addresses
        })
      },
      refetchInterval: getFetchingInterval(network),
      staleTime
    }))
  }, [xpNetworks, wallet, walletId, accounts, currency, isDeveloperMode])

  const results = useQueries({ queries })

  /**
   * Manually refetch all XP network balances.
   */
  const refetch = useCallback(async (): Promise<void> => {
    if (!wallet || accounts.length === 0 || xpNetworks.length === 0) return

    setIsRefetching(prev => ({ ...prev, [wallet.id]: true }))

    try {
      await Promise.allSettled(
        xpNetworks.map(network =>
          queryClient.refetchQueries({
            queryKey: balanceKey(wallet, network)
          })
        )
      )
    } finally {
      setIsRefetching(prev => ({ ...prev, [wallet.id]: false }))
    }
  }, [xpNetworks, wallet, accounts.length, queryClient, setIsRefetching])

  return {
    results,
    refetch,
    isRefetching: isRefetching[wallet?.id ?? ''] ?? false
  }
}
