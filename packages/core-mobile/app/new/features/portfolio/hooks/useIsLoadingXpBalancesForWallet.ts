import { useMemo } from 'react'
import { Wallet } from 'store/wallet/types'
import { useWalletXpBalances } from './useWalletXpBalances'

/**
 * Returns true if XP balances are currently loading for the given wallet.
 */
export const useIsLoadingXpBalancesForWallet = (wallet?: Wallet): boolean => {
  const { results: xpResults } = useWalletXpBalances(wallet)

  return useMemo(() => {
    return xpResults.some(r => r.isLoading)
  }, [xpResults])
}
