import { useMemo } from 'react'
import { Wallet } from 'store/wallet/types'
import { useWalletBalances } from './useWalletBalances'

/**
 * Returns whether all balances for the given wallet are accurate (no errors).
 */
export function useIsWalletBalanceAccurate(wallet?: Wallet): boolean {
  const { data } = useWalletBalances(wallet)

  return useMemo(() => {
    if (!wallet || Object.keys(data ?? {}).length === 0) return false

    // if any network dataAccurate is false → false
    const anyInaccurate = Object.values(data ?? {}).some(accounts =>
      accounts.some(account => account.dataAccurate === false)
    )
    return !anyInaccurate
  }, [wallet, data])
}
