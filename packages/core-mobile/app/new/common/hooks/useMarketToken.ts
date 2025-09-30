import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useMemo } from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import { MarketToken } from 'store/watchlist'
import Logger from 'utils/Logger'

export const useMarketToken = ({
  token,
  errorContext
}: {
  token: LocalTokenWithBalance | undefined
  errorContext?: string
}): MarketToken | undefined => {
  const { resolveMarketToken } = useWatchlist()

  return useMemo(() => {
    if (!token) return undefined

    const resolvedMarketToken = resolveMarketToken(token)
    if (errorContext && !resolvedMarketToken) {
      Logger.error(`[${errorContext}] Market token not found`, {
        symbol: token.symbol
      })
    }
    if (
      errorContext &&
      resolvedMarketToken?.priceChangePercentage24h === undefined
    ) {
      Logger.error(
        `[${errorContext}] Market token priceChangePercentage24h is undefined`,
        {
          symbol: token.symbol
        }
      )
    }
    return resolvedMarketToken
  }, [token, resolveMarketToken, errorContext])
}
