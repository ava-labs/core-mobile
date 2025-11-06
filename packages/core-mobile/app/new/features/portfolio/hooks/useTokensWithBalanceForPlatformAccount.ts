import { useMemo } from 'react'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useSelector } from 'react-redux'
import { selectEnabledNetworks } from 'store/network/slice'
import { LocalTokenWithBalance } from 'store/balance/types'
import { isDefined } from 'new/common/utils/isDefined'
import { queryClient } from 'contexts/ReactQueryProvider'
import { NormalizedBalancesForXpAddress } from 'services/balance/types'
import { Networks } from 'store/network'
import { Wallet } from 'store/wallet/types'
import { isPChain, isXChain } from 'utils/network/isAvalancheNetwork'
import { balanceKey, useWalletXpBalances } from './useWalletXpBalances'
import { isXpNetwork } from './utils'

/**
 * Returns token balances for platform account.
 * - If `chainId` is provided → returns tokens for specific X/P network only.
 * - If no `chainId` is provided → returns tokens across both X/P networks
 *   (filtered by developer mode to include only testnet/mainnet as appropriate).
 */
export function useTokensWithBalanceForPlatformAccount(
  wallet?: Wallet,
  chainId?: number
): LocalTokenWithBalance[] {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const networks = useSelector(selectEnabledNetworks)
  const { results } = useWalletXpBalances(wallet, chainId)

  return useMemo(() => {
    if (!wallet) return []

    // Each query result corresponds to one network’s balances
    const balancesForWallet = results
      .map(result => result.data)
      .filter(isDefined)
      .map(balance => Object.values(balance)[0])
      .filter(isDefined)

    // If chainId provided → return that specific network’s tokens
    if (chainId) {
      return (
        Object.values(balancesForWallet).find(
          balance => balance.chainId === chainId
        )?.tokens ?? []
      )
    }

    // Otherwise, return all tokens matching dev mode (mainnet/testnet)
    const filteredBalances = balancesForWallet.filter(balance => {
      const network = networks[balance.chainId]
      const isTestnet = network?.isTestnet
      return (isDeveloperMode && isTestnet) || (!isDeveloperMode && !isTestnet)
    })

    // Flatten all tokens into one array
    return filteredBalances.flatMap(balance => balance.tokens)
  }, [wallet, results, chainId, networks, isDeveloperMode])
}

/**
 * Retrieves token with balances for a given wallet on a given chain from React Query cache
 */
export function getTokensWithBalanceForPlatformAccountFromCache({
  wallet,
  networks,
  isDeveloperMode
}: {
  wallet?: Wallet
  networks: Networks
  isDeveloperMode: boolean
}): LocalTokenWithBalance[] {
  if (!wallet) return []

  const networkList = Object.values(networks)

  // only XP networks (AVM/PVM)
  const xpNetworks = networkList.filter(n => isXpNetwork(n))

  const results = xpNetworks
    .map(
      network =>
        queryClient.getQueryData(balanceKey(wallet, network)) as
          | Record<string, NormalizedBalancesForXpAddress>
          | undefined
    )
    .filter(isDefined)
    .map(balance => Object.values(balance)[0])
    .filter(isDefined)
    .filter(balance => isPChain(balance.chainId) || isXChain(balance.chainId))

  // Filter by developer mode (mainnet vs testnet)
  const filteredBalances = results.filter(balance => {
    const network = networks[balance.chainId]
    const isTestnet = network?.isTestnet
    return (isDeveloperMode && isTestnet) || (!isDeveloperMode && !isTestnet)
  })

  return filteredBalances.flatMap(balance => balance.tokens)
}
