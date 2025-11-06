import { useMemo } from 'react'
import { Wallet } from 'store/wallet/types'
import { useWalletXpBalances } from './useWalletXpBalances'

/**
 * Returns true if balance has been loaded for the given platform account.
 */
export function useIsBalanceLoadedForPlatformAccount(
  wallet?: Wallet,
  chainId?: number
): boolean {
  const { results } = useWalletXpBalances(wallet, chainId)

  return useMemo(() => {
    if (!wallet) return false

    // Any query that has successfully fetched data (even partial)
    return results.some(r => r.data !== undefined)
  }, [results, wallet])
}
