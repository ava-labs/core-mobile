import { useMemo } from 'react'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useSelector } from 'react-redux'
import { selectEnabledNetworksMap } from 'store/network/slice'
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
  const networks = useSelector(selectEnabledNetworksMap)
  const { data } = useAccountBalances(account)

  return useMemo(() => {
    if (!account) return []

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
    return filteredBalances.flatMap(balance => balance.tokens)
  }, [account, data, chainId, networks, isDeveloperMode])
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

  const results = (
    queryClient.getQueryData(balanceKey(account)) as
      | NormalizedBalancesForAccount[]
      | undefined
  )?.filter(balance => balance.accountId === account.id)

  if (!results) return []

  // Filter by developer mode (mainnet vs testnet)
  const filteredBalances = results.filter(balance => {
    const network = networks[balance.chainId]
    const isTestnet = network?.isTestnet
    return (isDeveloperMode && isTestnet) || (!isDeveloperMode && !isTestnet)
  })

  return filteredBalances.flatMap(balance => balance.tokens)
}
