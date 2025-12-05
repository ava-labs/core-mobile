import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectEnabledNetworksMap } from 'store/network'
import { isTokenVisible } from 'store/balance/utils'
import { selectTokenVisibility } from 'store/portfolio'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { Wallet } from 'store/wallet/types'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useWalletBalances } from './useWalletBalances'

/**
 * Returns the total balance (in fiat currency) for a given wallet,
 * filtered by token visibility and enabled networks.
 */
export function useBalanceTotalInCurrencyForWallet(wallet?: Wallet): number {
  const tokenVisibility = useFocusedSelector(selectTokenVisibility)
  const networks = useSelector(selectEnabledNetworksMap)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { data: walletBalances } = useWalletBalances(wallet)

  const tokens = useMemo(() => {
    // Filter tokens by dev mode
    const filteredBalances = Object.values(walletBalances)
      .flat()
      .filter(balance => {
        const network = networks[balance.chainId]
        const isTestnet = network?.isTestnet
        return (
          (isDeveloperMode && isTestnet) || (!isDeveloperMode && !isTestnet)
        )
      })

    // Flatten all tokens into one array
    return filteredBalances.flatMap(balance => balance.tokens)
  }, [walletBalances, networks, isDeveloperMode])

  return useMemo(() => {
    if (!wallet) return 0

    return tokens
      .filter(
        token =>
          // TODO: fix type mismatch after fully migrating to the new backend balance types
          // @ts-ignore
          isTokenVisible(tokenVisibility, token) &&
          networks[token.networkChainId] !== undefined
      )
      .reduce((acc, token) => acc + (token.balanceInCurrency ?? 0), 0)
  }, [wallet, tokens, tokenVisibility, networks])
}
