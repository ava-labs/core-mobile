import { useMemo } from 'react'
import { useAccountBalances } from 'features/portfolio/hooks/useAccountBalances'
import { Account } from 'store/account/types'

/**
 * Returns whether the balances for a specific network (chainId)
 * are marked as accurate for the given account.
 */
export function useIsBalanceAccurateByNetwork(
  account?: Account,
  chainId?: number
): boolean {
  const { results } = useAccountBalances(account, { enabled: false })

  return useMemo(() => {
    if (!account || !chainId) return false

    const target = results.find(r => r.data && r.data.chainId === chainId)

    return target?.data?.dataAccurate ?? false
  }, [account, chainId, results])
}
