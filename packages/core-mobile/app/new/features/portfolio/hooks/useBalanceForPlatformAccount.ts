import { useMemo } from 'react'
import { Wallet } from 'store/wallet/types'
import { useWalletXpBalances } from './useWalletXpBalances'
import { useBalanceTotalInCurrencyFoPlatformAccount } from './useBalanceTotalInCurrencyForPlatfomAccount'
import { useIsBalanceLoadedForPlatformAccount } from './useIsBalanceLoadedForPlatformAccount'

export const useBalanceForPlatformAccount = (
  wallet: Wallet,
  chainId: number
): {
  isBalanceLoaded: boolean
  fetchBalance: () => void
  isFetchingBalance: boolean
  balance: number
} => {
  const { results, refetch } = useWalletXpBalances(wallet, chainId)
  const accountBalance = useBalanceTotalInCurrencyFoPlatformAccount(
    wallet,
    chainId
  )

  const isBalanceLoaded = useIsBalanceLoadedForPlatformAccount(wallet, chainId)

  const isFetching = useMemo(
    () => results.some(r => r.isLoading || r.isFetching),
    [results]
  )

  return {
    balance: accountBalance,
    fetchBalance: refetch,
    isFetchingBalance: isFetching,
    isBalanceLoaded
  }
}
