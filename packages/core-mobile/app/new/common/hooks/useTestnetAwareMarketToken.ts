import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { MarketToken } from 'store/watchlist'
import { useMarketTokenBySymbol } from './useMarketTokenBySymbol'

/**
 * Fiat-display variants of the watchlist symbol lookup.
 *
 * Testnet tokens reuse their mainnet symbol (Fuji AVAX is still "AVAX"), so a
 * plain symbol lookup prices testnet funds at the mainnet market rate. Testnet
 * funds have no market value, so these return `undefined` in developer mode and
 * each call site's existing "no price" branch hides the fiat value (CP-15076).
 *
 * Use these anywhere a fiat value is DISPLAYED. Conversion math that must keep
 * working in developer mode — the Meld buy/sell flow converts between a fiat
 * input and a mainnet asset — should keep using `useMarketTokenBySymbol` and
 * `useWatchlist` directly.
 */
export const useTestnetAwareMarketTokenBySymbol = ({
  symbol
}: {
  symbol: string | undefined
}): MarketToken | undefined => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const marketToken = useMarketTokenBySymbol({ symbol })

  return isDeveloperMode ? undefined : marketToken
}

/**
 * Getter form, for call sites that look up a symbol that is only known inside a
 * render callback rather than at hook-call time.
 */
export const useTestnetAwareGetMarketTokenBySymbol = (): ((
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
