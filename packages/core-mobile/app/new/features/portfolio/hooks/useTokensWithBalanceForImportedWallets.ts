import { useMemo } from 'react'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useSelector } from 'react-redux'
import { selectEnabledNetworks } from 'store/network/slice'
import { LocalTokenWithBalance } from 'store/balance/types'
import { selectImportedAccounts } from 'store/account'
import { selectImportedWallets } from 'store/wallet/slice'
import { getTokensWithBalanceForPlatformAccountFromCache } from './useTokensWithBalanceForPlatformAccount'
import { getTokensWithBalanceForAccountFromCache } from './useTokensWithBalanceForAccount'

/**
 * Returns token balances for imported accounts.
 *   (filtered by developer mode to include only testnet/mainnet as appropriate).
 */
export function useTokensWithBalanceForImportedWallets(): {
  accountTokens: LocalTokenWithBalance[]
  platformTokens: LocalTokenWithBalance[]
} {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const accounts = useSelector(selectImportedAccounts)
  const importedWallets = useSelector(selectImportedWallets)
  const networks = useSelector(selectEnabledNetworks)

  const accountTokens = useMemo(
    () =>
      accounts.reduce((acc, account) => {
        const tks = getTokensWithBalanceForAccountFromCache({
          account,
          networks,
          isDeveloperMode
        })
        return [...acc, ...tks]
      }, [] as LocalTokenWithBalance[]),
    [accounts, networks, isDeveloperMode]
  )

  const platformTokens = useMemo(
    () =>
      importedWallets.reduce((acc, wallet) => {
        const tokens = getTokensWithBalanceForPlatformAccountFromCache({
          wallet,
          networks,
          isDeveloperMode
        })
        return [...acc, ...tokens]
      }, [] as LocalTokenWithBalance[]),
    [importedWallets, networks, isDeveloperMode]
  )

  return useMemo(() => {
    return {
      accountTokens,
      platformTokens
    }
  }, [accountTokens, platformTokens])
}
