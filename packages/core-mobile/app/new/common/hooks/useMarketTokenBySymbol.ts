import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useMemo } from 'react'
import { MarketToken } from 'store/watchlist'

export const useMarketTokenBySymbol = ({
  symbol
}: {
  symbol: string | undefined
}): MarketToken | undefined => {
  const { getMarketTokenBySymbol } = useWatchlist()

  return useMemo(() => {
    if (!symbol) return undefined

    return getMarketTokenBySymbol(symbol)
  }, [symbol, getMarketTokenBySymbol])
}
