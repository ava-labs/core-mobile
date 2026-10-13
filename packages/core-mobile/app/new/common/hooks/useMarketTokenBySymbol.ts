import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { MarketToken } from 'store/watchlist'

/**
 * Watchlist symbol lookup, gated on developer mode.
 *
 * Testnet tokens reuse their mainnet symbol (Fuji AVAX is still "AVAX"), so a
 * plain symbol lookup prices testnet funds at the mainnet market rate. Testnet
 * funds have no market value, so this returns `undefined` in developer mode and
 * each call site's existing "no price" branch hides the fiat value (CP-15076).
 *
 * The Meld buy/sell flow reads this too. It has no developer-mode gate of its
 * own, but on/off ramping is not a testnet feature, so it gets no price there
 * either rather than a mainnet one.
 */
export const useMarketTokenBySymbol = ({
  symbol
}: {
  symbol: string | undefined
}): MarketToken | undefined => {
  const getMarketTokenBySymbol = useGetMarketTokenBySymbol()

  return useMemo(() => {
    if (!symbol) return undefined

    return getMarketTokenBySymbol(symbol)
  }, [symbol, getMarketTokenBySymbol])
}

/**
 * Getter form, for call sites that look up a symbol that is only known inside a
 * render callback rather than at hook-call time.
 */
export const useGetMarketTokenBySymbol = (): ((
  symbol: string
) => MarketToken | undefined) => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { getMarketTokenBySymbol } = useWatchlist()

  return useCallback(
    (symbol: string): MarketToken | undefined =>
      isDeveloperMode ? undefined : getMarketTokenBySymbol(symbol),
    [isDeveloperMode, getMarketTokenBySymbol]
  )
}
