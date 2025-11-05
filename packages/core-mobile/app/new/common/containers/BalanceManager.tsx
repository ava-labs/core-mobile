import { useEffect } from 'react'
import { useAccountBalances } from 'features/portfolio/hooks/useAccountBalances'
import { useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { selectIsSolanaSupportBlocked } from 'store/posthog/slice'
import { addCustomNetwork, selectEnabledNetworks } from 'store/network/slice'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import NetworkService from 'services/network/NetworkService'
import { selectActiveAccount } from 'store/account/slice'
import { selectActiveWallet } from 'store/wallet/slice'
import { useWalletXpBalances } from 'features/portfolio/hooks/useWalletXpBalances'
import { addCustomToken } from 'store/customToken/slice'
import { addListener, isAnyOf } from '@reduxjs/toolkit'

/**
 * 🧭 BalanceManager
 *
 * Centralized coordinator for all background balance fetching across the app.
 *
 * This component mounts once and ensures all balance-related React Query data is
 * properly initialized, invalidated, and refreshed in response to app-wide events.
 *
 * 🔍 Responsibilities:
 * - Mounts:
 *    • `useAccountBalances(activeAccount)` → fetches balances for all enabled non-XP networks (EVM, BTC, SOL, etc.)
 *    • `useWalletXpBalances(activeWallet)` → fetches balances for all XP networks (X- and P-Chains)
 *
 * - Ensures network data is preloaded (via `NetworkService.getNetworks`) when missing.
 *
 * - Listens for Redux actions such as `addCustomToken` and `addCustomNetwork`
 *   and invalidates relevant balance queries to trigger automatic refetches.
 */
export const BalanceManager = (): null => {
  const dispatch = useDispatch()
  const activeAccount = useSelector(selectActiveAccount)
  const activeWallet = useSelector(selectActiveWallet)
  const { invalidate: invalidateAccountBalances } =
    useAccountBalances(activeAccount)
  useWalletXpBalances(activeWallet)

  const queryClient = useQueryClient()
  const enabledNetworks = useSelector(selectEnabledNetworks)
  const isSolanaSupportBlocked = useSelector(selectIsSolanaSupportBlocked)

  useEffect(() => {
    // TODO test if this is needed
    const ensureNetworksAreAvailable = async (): Promise<void> => {
      if (enabledNetworks.length === 0) {
        await queryClient.prefetchQuery({
          queryKey: [ReactQueryKeys.NETWORKS, !isSolanaSupportBlocked],
          queryFn: () =>
            NetworkService.getNetworks({
              includeSolana: !isSolanaSupportBlocked
            })
        })
      }
    }

    ensureNetworksAreAvailable()
  }, [enabledNetworks.length, isSolanaSupportBlocked, queryClient])

  // @ts-ignore
  useEffect(() => {
    // TODO test this
    return dispatch(
      addListener({
        matcher: isAnyOf(addCustomToken, addCustomNetwork),
        effect: async () => {
          if (!activeAccount) return
          await invalidateAccountBalances()
        }
      })
    )
  }, [activeAccount, dispatch, invalidateAccountBalances])

  return null
}
