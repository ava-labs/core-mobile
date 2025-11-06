import { useMemo } from 'react'
import { useImportedAccountXpBalances } from './useImportedAccountXpBalances'

/**
 * Returns true if balance has been loaded for the imported platform account.
 */
export function useIsBalanceLoadedForImportedPlatformAccount(
  chainId?: number
): boolean {
  const { results } = useImportedAccountXpBalances(chainId, { enabled: false })

  return useMemo(() => {
    // Any query that has successfully fetched data (even partial)
    return results.some(r => r.data !== undefined)
  }, [results])
}
