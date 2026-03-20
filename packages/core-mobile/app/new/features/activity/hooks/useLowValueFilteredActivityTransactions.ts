import { Network } from '@avalabs/core-chains-sdk'
import { filterOutLowValueActivityTransactions } from 'features/activity/filterLowValueActivity'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useMemo } from 'react'
import { Transaction } from 'store/transaction'

export function useLowValueFilteredActivityTransactions(
  transactions: Transaction[],
  network: Network | undefined
): Transaction[] {
  const { getMarketTokenBySymbol } = useWatchlist()

  return useMemo(
    () =>
      filterOutLowValueActivityTransactions(transactions, {
        isTestnet: network?.isTestnet === true,
        getMarketTokenBySymbol
      }),
    [transactions, network?.isTestnet, getMarketTokenBySymbol]
  )
}
