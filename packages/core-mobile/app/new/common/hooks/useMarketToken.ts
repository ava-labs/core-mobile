import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useMemo } from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import { MarketToken } from 'store/watchlist'

export const useMarketToken = ({
  token
}: {
  token: LocalTokenWithBalance | undefined
}): MarketToken | undefined => {
  const { resolveMarketToken } = useWatchlist()

  return useMemo(() => {
    if (!token) return undefined

    return resolveMarketToken(token)
  }, [token, resolveMarketToken])
}
