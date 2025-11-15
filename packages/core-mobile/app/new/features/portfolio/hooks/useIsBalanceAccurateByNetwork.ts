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
  const { data } = useAccountBalances(account)

  return useMemo(() => {
    if (!account || !chainId) return false

    const target = data.find(balance => balance.chainId === chainId)

    return target?.dataAccurate ?? false
  }, [account, chainId, data])
}
