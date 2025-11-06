import { useMemo } from 'react'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useSelector } from 'react-redux'
import { selectEnabledNetworks } from 'store/network/slice'
import { LocalTokenWithBalance } from 'store/balance/types'
import { Wallet } from 'store/wallet/types'
import { RootState } from 'store/types'
import { selectAccountsByWalletId } from 'store/account'
import { getTokensWithBalanceForPlatformAccountFromCache } from './useTokensWithBalanceForPlatformAccount'
import { getTokensWithBalanceForAccountFromCache } from './useTokensWithBalanceForAccount'
import { isXpNetwork } from './utils'

/**
 * Returns token balances for a specific wallet.
 *   (filtered by developer mode to include only testnet/mainnet as appropriate).
 */
export function useTokensWithBalanceForWallet(wallet?: Wallet): {
  accountTokens: LocalTokenWithBalance[]
  platformTokens: LocalTokenWithBalance[]
} {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const accounts = useSelector((state: RootState) =>
    selectAccountsByWalletId(state, wallet?.id ?? '')
  )
  const networks = useSelector(selectEnabledNetworks)

  const platformNetworks = useMemo(() => {
    return networks.filter(network => isXpNetwork(network))
  }, [networks])

  const nonPlatformNetworks = useMemo(() => {
    return networks.filter(network => !isXpNetwork(network))
  }, [networks])

  const accountTokens = useMemo(
    () =>
      accounts.reduce((acc, account) => {
        const tks = getTokensWithBalanceForAccountFromCache({
          account,
          networks: nonPlatformNetworks,
          isDeveloperMode
        })
        return [...acc, ...tks]
      }, [] as LocalTokenWithBalance[]),
    [accounts, nonPlatformNetworks, isDeveloperMode]
  )

  const platformTokens = useMemo(
    () =>
      getTokensWithBalanceForPlatformAccountFromCache({
        wallet,
        networks: platformNetworks,
        isDeveloperMode
      }),
    [wallet, platformNetworks, isDeveloperMode]
  )

  return useMemo(() => {
    if (!wallet) return { accountTokens: [], platformTokens: [] }
    return { accountTokens, platformTokens }
  }, [accountTokens, platformTokens, wallet])
}
