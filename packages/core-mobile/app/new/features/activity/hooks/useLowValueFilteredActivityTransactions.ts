import { Network } from '@avalabs/core-chains-sdk'
import {
  buildSymbolToPriceMapFromMarketTokens,
  filterOutLowValueActivityTransactions
} from 'features/activity/filterLowValueActivity'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useMemo } from 'react'
import { Transaction } from 'store/transaction'

export function useLowValueFilteredActivityTransactions(
  transactions: Transaction[],
  network: Network | undefined
): Transaction[] {
  const { allTokens } = useWatchlist()

  const symbolToPriceUsd = useMemo(
    () => buildSymbolToPriceMapFromMarketTokens(allTokens),
    [allTokens]
  )

  return useMemo(
    () =>
      filterOutLowValueActivityTransactions(transactions, {
        isTestnet: network?.isTestnet === true,
        symbolToPriceUsd
      }),
    [transactions, network?.isTestnet, symbolToPriceUsd]
  )
}
