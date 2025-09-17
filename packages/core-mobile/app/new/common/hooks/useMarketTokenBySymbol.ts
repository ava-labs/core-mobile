import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useMemo } from 'react'
import { MarketToken } from 'store/watchlist'
import Logger from 'utils/Logger'

export const useMarketTokenBySymbol = ({
  symbol,
  errorContext
}: {
  symbol: string
  errorContext?: string
}): MarketToken | undefined => {
  const { getMarketTokenBySymbol } = useWatchlist()

  return useMemo(() => {
    const tokenBySymbol = getMarketTokenBySymbol(symbol)
    if (errorContext && !tokenBySymbol) {
      Logger.error(`[${errorContext}] Market token not found`, { symbol })
    }
    if (errorContext && tokenBySymbol?.priceChangePercentage24h === undefined) {
      Logger.error(
        `[${errorContext}] Market token priceChangePercentage24h is undefined`,
        {
          symbol
        }
      )
    }
    return tokenBySymbol
  }, [symbol, getMarketTokenBySymbol, errorContext])
}
