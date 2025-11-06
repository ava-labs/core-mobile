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

/**
 * Returns token balances for a specific wallet.
 *   (filtered by developer mode to include only testnet/mainnet as appropriate).
 */
export function useTokensWithBalanceForWallet(
  wallet?: Wallet
): LocalTokenWithBalance[] {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const accounts = useSelector((state: RootState) =>
    selectAccountsByWalletId(state, wallet?.id ?? '')
  )
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
      getTokensWithBalanceForPlatformAccountFromCache({
        wallet,
        networks,
        isDeveloperMode
      }),
    [wallet, networks, isDeveloperMode]
  )

  const tokens = useMemo(
    () => [...accountTokens, ...platformTokens],
    [accountTokens, platformTokens]
  )

  return useMemo(() => {
    if (!wallet) return []
    return tokens
  }, [tokens, wallet])
}
