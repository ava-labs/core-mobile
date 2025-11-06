import { useMemo } from 'react'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useSelector } from 'react-redux'
import { selectEnabledNetworks } from 'store/network/slice'
import { LocalTokenWithBalance } from 'store/balance/types'
import { selectImportedWallets } from 'store/wallet/slice'
import { getTokensWithBalanceForPlatformAccountFromCache } from './useTokensWithBalanceForPlatformAccount'

/**
 * Returns token balances for imported platform account.
 *   (filtered by developer mode to include only testnet/mainnet as appropriate).
 */
export function useTokensWithBalanceForImportedPlatformAccount(
  chainId?: number
): LocalTokenWithBalance[] {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const importedWallets = useSelector(selectImportedWallets)
  const networks = useSelector(selectEnabledNetworks)

  const network = chainId
    ? networks.find(n => n.chainId === chainId)
    : undefined

  return useMemo(
    () =>
      importedWallets.reduce((acc, wallet) => {
        const tokens = getTokensWithBalanceForPlatformAccountFromCache({
          wallet,
          networks: network ? [network] : networks,
          isDeveloperMode
        })
        return [...acc, ...tokens]
      }, [] as LocalTokenWithBalance[]),
    [importedWallets, network, networks, isDeveloperMode]
  )
}
