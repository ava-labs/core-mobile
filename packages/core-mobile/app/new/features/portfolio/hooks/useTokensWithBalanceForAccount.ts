import { useMemo } from 'react'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useSelector } from 'react-redux'
import { selectEnabledNetworks } from 'store/network/slice'
import { Account } from 'store/account/types'
import { LocalTokenWithBalance } from 'store/balance/types'
import { isDefined } from 'new/common/utils/isDefined'
import { queryClient } from 'contexts/ReactQueryProvider'
import { NormalizedBalancesForAccount } from 'services/balance/types'
import { Networks } from 'store/network'
import { balanceKey, useAccountBalances } from './useAccountBalances'

/**
 * Returns token balances for a specific account.
 * - If `chainId` is provided → returns tokens for that network only.
 * - If no `chainId` is provided → returns tokens across all enabled networks
 *   (filtered by developer mode to include only testnet/mainnet as appropriate).
 */
export function useTokensWithBalanceForAccount(
  account?: Account,
  chainId?: number
): LocalTokenWithBalance[] {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const networks = useSelector(selectEnabledNetworks)
  const { results } = useAccountBalances(account, { enabled: false })

  return useMemo(() => {
    if (!account) return []

    // Each query result corresponds to one network’s balances
    const balancesForAccount = results
      .map(result => result.data)
      .filter(isDefined)
      .filter(balance => balance.accountId === account.id)

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
    return filteredBalances.flatMap(balance => balance.tokens)
  }, [account, results, chainId, networks, isDeveloperMode])
}

/**
 * Retrieves token with balances for a given account from React Query cache
 */
export function getTokensWithBalanceForAccountFromCache({
  account,
  networks,
  isDeveloperMode
}: {
  account?: Account
  networks: Networks
  isDeveloperMode: boolean
}): LocalTokenWithBalance[] {
  if (!account) return []

  const networkList = Object.values(networks)

  // Skip XP networks (AVM/PVM)
  // const nonXpNetworks = networkList.filter(n => !isXpNetwork(n))

  const results = networkList
    .map(
      network =>
        queryClient.getQueryData(balanceKey(account, network)) as
          | NormalizedBalancesForAccount
          | undefined
    )
    .filter(isDefined)
    .filter(balance => balance.accountId === account.id)

  // Filter by developer mode (mainnet vs testnet)
  const filteredBalances = results.filter(balance => {
    const network = networks[balance.chainId]
    const isTestnet = network?.isTestnet
    return (isDeveloperMode && isTestnet) || (!isDeveloperMode && !isTestnet)
  })

  return filteredBalances.flatMap(balance => balance.tokens)
}
