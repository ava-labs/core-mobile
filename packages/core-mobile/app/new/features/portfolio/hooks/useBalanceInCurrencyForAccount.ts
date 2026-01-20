import { isDefined } from 'common/utils/isDefined'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { AdjustedNormalizedBalancesForAccount } from 'services/balance/types'
import { Account, selectAccountById } from 'store/account'
import { LocalTokenWithBalance } from 'store/balance'
import { isTokenVisible } from 'store/balance/utils'
import {
  selectEnabledChainIds,
  selectEnabledNetworks,
  selectEnabledNetworksMap
} from 'store/network/slice'
import { selectTokenVisibility } from 'store/portfolio'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { useAllBalances } from './useAllBalances'
/**
 * Returns the total balance and loading state for a given account.
 *
 * Behavior:
 * - For the active account, this hook uses data from `useAccountBalances`,
 *   which fetches balance updates more frequently.
 * - For non-active accounts, it falls back to data from `useAllBalances`,
 *   which loads once on mount and reuses cached wallet-level data.
 */
export const useBalanceInCurrencyForAccount = (
  accountId: string
): {
  isLoadingBalance: boolean
  hasBalanceData: boolean
  balance: number
  dataAccurate: boolean
  error: string | null
} => {
  const account = useSelector(selectAccountById(accountId))
  const enabledNetworks = useSelector(selectEnabledNetworks)
  const { data: balances, isError } = useAllBalances()

  const balanceTotalInCurrency = useBalanceTotalInCurrencyForAccount({
    account,
    // TODO: fix type mismatch after fully migrating to the new backend balance types
    // @ts-ignore
    sourceData: balances[accountId]
  })

  const isLoadingBalance = (() => {
    if (!account) return true
    if (enabledNetworks.length === 0) return true
    if (isError) return false
    const accountBalances = balances[accountId] ?? []
    return (
      accountBalances.length === 0 ||
      accountBalances.length < enabledNetworks.length
    )
  })()

  const hasBalanceData = (() => {
    if (!account) return false
    const accountBalances = balances[accountId] ?? []
    return accountBalances.length > 0
  })()

  const dataAccurate = (() => {
    if (!account) return false
    const accountBalances = balances[accountId] ?? []
    return accountBalances.every(balance => balance.dataAccurate)
  })()

  const error = (() => {
    if (!account) return null
    const accountBalances = balances[accountId] ?? []
    return accountBalances.find(balance => balance.error)?.error?.error ?? null
  })()

  return {
    balance: balanceTotalInCurrency,
    dataAccurate,
    error,
    hasBalanceData,
    isLoadingBalance
  }
}

function useBalanceTotalInCurrencyForAccount({
  account,
  sourceData
}: {
  account?: Account
  sourceData?: AdjustedNormalizedBalancesForAccount[]
}): number {
  const tokenVisibility = useFocusedSelector(selectTokenVisibility)
  const enabledChainIds = useFocusedSelector(selectEnabledChainIds)
  const tokens = useTokensWithBalanceForAccount({ account, sourceData })

  return useMemo(() => {
    if (!account) return 0

    return tokens
      .filter(
        token =>
          isTokenVisible(tokenVisibility, token) &&
          enabledChainIds.includes(token.networkChainId)
      )
      .reduce((acc, token) => acc + (token.balanceInCurrency ?? 0), 0)
  }, [tokens, tokenVisibility, enabledChainIds, account])
}

function useTokensWithBalanceForAccount({
  account,
  chainId,
  sourceData
}: {
  account?: Account
  chainId?: number
  sourceData?: AdjustedNormalizedBalancesForAccount[]
}): LocalTokenWithBalance[] {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const networks = useSelector(selectEnabledNetworksMap)

  const data = sourceData

  // TODO: fix type mismatch after fully migrating to the new backend balance types
  // @ts-ignore
  return useMemo(() => {
    if (!account || !data) return []

    const balancesForAccount = data.filter(
      balance => balance.accountId === account.id
    )

    // If chainId provided → return that specific network’s tokens
    if (chainId) {
      return (
        balancesForAccount.find(balance => balance.chainId === chainId)
          ?.tokens ?? []
      )
    }

    // Otherwise, return all tokens matching dev mode (mainnet/testnet)
    const filteredBalances = balancesForAccount
      .filter(isDefined)
      .filter(balance => {
        const network = networks[balance.chainId]
        const isTestnet = network?.isTestnet
        return (
          (isDeveloperMode && isTestnet) || (!isDeveloperMode && !isTestnet)
        )
      })

    // Flatten all tokens into one array
    // TODO: fix type mismatch after fully migrating to the new backend balance types
    // @ts-ignore
    return filteredBalances.flatMap(balance => balance.tokens)
  }, [account, data, chainId, networks, isDeveloperMode])
}
