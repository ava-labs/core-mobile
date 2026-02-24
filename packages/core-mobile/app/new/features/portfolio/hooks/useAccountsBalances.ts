import {
  QueryObserverResult,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import BalanceService from 'services/balance/BalanceService'
import { AdjustedNormalizedBalancesForAccounts } from 'services/balance/types'
import { Account } from 'store/account'
import { selectEnabledNetworks } from 'store/network/slice'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import { selectWallets } from 'store/wallet/slice'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { getCachedXPAddresses } from 'hooks/useXPAddresses/useXPAddresses'
import { getXpubXPIfAvailable } from 'utils/getAddressesFromXpubXP/getAddressesFromXpubXP'
import Logger from 'utils/Logger'

/**
 * Stale time in milliseconds
 */
const staleTime = 30_000

/**
 * Refetch interval in milliseconds:
 * - 30 seconds in dev mode
 * - 5 seconds in prod mode
 */
const refetchInterval = __DEV__ ? 30_000 : 5_000

export const balancesKey = (params: {
  currency: string
  enabledChainIdsKey: string
}) =>
  [
    ReactQueryKeys.ACCOUNTS_BALANCES,
    params.currency.toLowerCase(),
    params.enabledChainIdsKey
  ] as const

/**
 * Returns whether all balances for all accounts are inaccurate (dataAccurate === false),
 * along with loading states, data, and refetch function.
 */
export function useAccountsBalances(
  accounts: Account[],
  options?: { refetchInterval?: number | false }
): {
  data: AdjustedNormalizedBalancesForAccounts
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<
    QueryObserverResult<AdjustedNormalizedBalancesForAccounts, Error>
  >
} {
  const queryClient = useQueryClient()
  const enabledNetworks = useSelector(selectEnabledNetworks)
  const currency = useSelector(selectSelectedCurrency)
  const wallets = useSelector(selectWallets)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const enabledChainIdsKey = useMemo(() => {
    // Stable + order-independent key
    return enabledNetworks
      .map(n => n.chainId)
      .sort((a, b) => a - b)
      .join(',')
  }, [enabledNetworks])

  const queryKey = useMemo(
    () =>
      balancesKey({
        currency,
        enabledChainIdsKey
      }),
    [currency, enabledChainIdsKey]
  )

  const isNotReady = accounts.length === 0 || enabledNetworks.length === 0

  // Ensure newly-added accounts have an entry in the cached map without wiping existing balances.
  React.useEffect(() => {
    if (isNotReady) return
    queryClient.setQueryData(
      queryKey,
      (prev: AdjustedNormalizedBalancesForAccounts | undefined) => {
        const previous = prev ?? {}
        let changed = false
        const next = { ...previous }

        accounts.forEach(account => {
          if (next[account.id] === undefined) {
            next[account.id] = []
            changed = true
          }
        })

        return changed ? next : previous
      }
    )
  }, [accounts, isNotReady, queryClient, queryKey])

  const { data, isFetching, isError, error, refetch } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey,
    enabled: !isNotReady,
    staleTime,
    refetchOnMount: 'always',
    refetchInterval: options?.refetchInterval ?? refetchInterval,
    queryFn: async () => {
      // Build xpAddresses map for all accounts
      const xpAddressesByAccountId = new Map<string, string[]>()
      const xpubByAccountId = new Map<string, string | undefined>()

      await Promise.all(
        accounts.map(async account => {
          const wallet = wallets[account.walletId]
          if (!wallet) {
            // This should never happen, but guard and log against it just in case
            Logger.error(
              'useAccountsBalances',
              `Wallet not found for account ${account.id}`
            )
            return
          }
          const xpub = await getXpubXPIfAvailable({
            walletId: wallet.id,
            walletType: wallet.type,
            accountIndex: account.index
          })
          xpubByAccountId.set(account.id, xpub)
          if (!xpub) {
            const { xpAddresses } = await getCachedXPAddresses({
              walletId: wallet.id,
              walletType: wallet.type,
              account,
              isDeveloperMode
            })
            xpAddressesByAccountId.set(account.id, xpAddresses)
          }
        })
      )

      return BalanceService.getBalancesForAccounts({
        networks: enabledNetworks,
        accounts,
        currency: currency.toLowerCase(),
        xpAddressesByAccountId,
        xpubByAccountId,
        onBalanceLoaded: balance => {
          queryClient.setQueryData(
            queryKey,
            (prev: AdjustedNormalizedBalancesForAccounts | undefined) => {
              const previous = prev ?? {}
              const prevForAccount = previous[balance.accountId] ?? []
              const filtered = prevForAccount.filter(
                p => p.chainId !== balance.chainId
              )

              return {
                ...previous,
                [balance.accountId]: [...filtered, balance]
              }
            }
          )
        }
      })
    }
  })

  const isLoading = useMemo(() => {
    // If the query failed, don't keep the UI in a "loading" state — let consumers
    // render an explicit error state (even if we have cached/partial data).
    if (isError) return false

    // Treat as "initial load" only: once we have *any* balances, don't flip back to loading
    // when accounts are added (only the new account should be loading).
    return (
      accounts.length === 0 ||
      !data ||
      enabledNetworks.length === 0 ||
      Object.values(data).flat().length === 0 ||
      Object.values(data).flat().length < enabledNetworks.length
    )
  }, [accounts.length, data, enabledNetworks.length, isError])

  return {
    data: data ?? {},
    isLoading,
    isFetching,
    isError,
    error: (error as Error | null) ?? null,
    refetch
  }
}
