import {
  QueryObserverResult,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import BalanceService from 'services/balance/BalanceService'
import {
  AdjustedNormalizedBalancesForAccount,
  AdjustedNormalizedBalancesForAccounts
} from 'services/balance/types'
import { Account } from 'store/account'
import { Network } from '@avalabs/core-chains-sdk'
import { selectEnabledNetworks } from 'store/network/slice'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import {
  selectIsMigratingActiveAccounts,
  selectWallets
} from 'store/wallet/slice'
import { Wallet } from 'store/wallet/types'
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

/**
 * Throttled refetch interval used while account discovery is in progress.
 * Frequent refetches during discovery waste JS thread time on balance data
 * that will be stale as soon as the next account is added (CP-14062).
 */
const refetchIntervalDuringMigration = 30_000

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
 * Generation counter so that stale flush timers from a previous queryFn
 * invocation no-op instead of writing outdated balances to the cache.
 * Each call to createBufferedBalanceHandler increments the counter; if
 * the generation has advanced by the time setTimeout fires, the flush
 * is skipped (CP-14062).
 */
let balanceHandlerGeneration = 0

/**
 * Creates a buffered onBalanceLoaded callback that batches incoming balance
 * updates and flushes them in a single setQueryData call per macrotask tick.
 * Without buffering, every (account, chain) pair triggers its own cache
 * mutation + re-render (CP-14062).
 */
function createBufferedBalanceHandler(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: ReturnType<typeof balancesKey>
): (balance: AdjustedNormalizedBalancesForAccount) => void {
  const generation = ++balanceHandlerGeneration
  let pendingBalances: AdjustedNormalizedBalancesForAccount[] = []
  let flushScheduled = false

  const flush = (): void => {
    // A newer queryFn invocation has created a new handler — discard
    // this stale flush to avoid writing outdated data to the cache.
    if (generation !== balanceHandlerGeneration) return

    const toFlush = pendingBalances
    pendingBalances = []
    flushScheduled = false

    if (toFlush.length === 0) return

    queryClient.setQueryData(
      queryKey,
      (prev: AdjustedNormalizedBalancesForAccounts | undefined) => {
        const next = { ...(prev ?? {}) }

        for (const balance of toFlush) {
          const prevForAccount = next[balance.accountId] ?? []
          const filtered = prevForAccount.filter(
            p => p.chainId !== balance.chainId
          )
          next[balance.accountId] = [...filtered, balance]
        }

        return next
      }
    )
  }

  return (balance: AdjustedNormalizedBalancesForAccount) => {
    pendingBalances.push(balance)

    if (!flushScheduled) {
      flushScheduled = true
      setTimeout(flush, 0)
    }
  }
}

async function fetchAccountBalances({
  accounts,
  wallets,
  enabledNetworks,
  currency,
  isDeveloperMode,
  onBalanceLoaded
}: {
  accounts: Account[]
  wallets: Record<string, Wallet>
  enabledNetworks: Network[]
  currency: string
  isDeveloperMode: boolean
  onBalanceLoaded: (balance: AdjustedNormalizedBalancesForAccount) => void
}): Promise<AdjustedNormalizedBalancesForAccounts> {
  const xpAddressesByAccountId = new Map<string, string[]>()
  const xpubByAccountId = new Map<string, string | undefined>()

  await Promise.all(
    accounts.map(async account => {
      const wallet = wallets[account.walletId]
      if (!wallet) {
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
    onBalanceLoaded
  })
}

/**
 * Ensures newly-added accounts have an entry in the cached balance map
 * without wiping existing balances.
 */
function seedNewAccountEntries(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: ReturnType<typeof balancesKey>,
  accounts: Account[]
): void {
  queryClient.setQueryData(
    queryKey,
    (prev: AdjustedNormalizedBalancesForAccounts | undefined) => {
      const previous = prev ?? {}
      let changed = false
      const next = { ...previous }

      for (const account of accounts) {
        if (next[account.id] === undefined) {
          next[account.id] = []
          changed = true
        }
      }

      return changed ? next : previous
    }
  )
}

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
  const isMigrating = useSelector(selectIsMigratingActiveAccounts)

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

  // Throttle balance refetches while account discovery is in progress.
  // The data fetched during discovery is stale immediately since new
  // accounts keep being added (CP-14062).
  const effectiveRefetchInterval =
    options?.refetchInterval ??
    (isMigrating ? refetchIntervalDuringMigration : refetchInterval)

  React.useEffect(() => {
    if (!isNotReady) {
      seedNewAccountEntries(queryClient, queryKey, accounts)
    }
  }, [accounts, isNotReady, queryClient, queryKey])

  const { data, isFetching, isError, error, refetch } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey,
    enabled: !isNotReady,
    staleTime,
    refetchOnMount: 'always',
    refetchInterval: effectiveRefetchInterval,
    queryFn: () =>
      fetchAccountBalances({
        accounts,
        wallets,
        enabledNetworks,
        currency,
        isDeveloperMode,
        onBalanceLoaded: createBufferedBalanceHandler(queryClient, queryKey)
      })
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
