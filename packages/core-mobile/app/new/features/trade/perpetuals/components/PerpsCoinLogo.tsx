import { useTheme, View } from '@avalabs/k2-alpine'
import { hyperliquidCoinSvgUrl } from '@avalabs/perps-sdk'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import React from 'react'
import { SvgCss } from 'react-native-svg/css'

/**
 * Fetch the hosted coin SVG once per URL and cache it for the session. Logos are
 * static, so this avoids re-downloading (and re-flashing the placeholder) every
 * time a `PerpsCoinLogo` mounts — list-row recycling, navigating between the
 * assets list / coin page / search, or any parent re-render.
 */
const useCoinSvg = (uri: string): string | undefined => {
  const { data } = useQuery({
    queryKey: [ReactQueryKeys.PERPS_COIN_SVG, uri],
    queryFn: async () => {
      const response = await fetch(uri)
      if (!response.ok) {
        throw new Error(`Failed to load coin SVG: ${response.status}`)
      }
      const text = await response.text()
      // Hyperliquid serves an HTML page (not an SVG) for coins without art;
      // reject it so we fall back to the placeholder instead of rendering junk.
      if (!text.trimStart().startsWith('<svg')) {
        throw new Error('Not an SVG')
      }
      return text
    },
    // Coin art never changes; keep it cached for the whole session and don't
    // retry misses (they're just "no logo").
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false
  })

  return data
}

/**
 * Coin logo for a Hyperliquid perp market. Loads the hosted coin art (SVG) and
 * shows a single-theme-color circle as the placeholder until it loads (or if it
 * fails / is unavailable for a market).
 *
 * Light: rgba(40, 40, 46, 0.1). Dark: rgba(255, 255, 255, 0.1).
 */
export const PerpsCoinLogo = ({
  symbol,
  size = 40
}: {
  symbol: string
  size?: number
}): JSX.Element => {
  const { theme } = useTheme()
  // HIP-3 coins are namespaced `dex:TICKER`; their art is hosted under the same
  // `dex:SYMBOL.svg` convention, so pass the full coin id through (the SDK's
  // URL builder preserves the dex prefix and URL-encodes the colon).
  const xml = useCoinSvg(hyperliquidCoinSvgUrl(symbol))

  const placeholderColor = theme.isDark
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(40, 40, 46, 0.1)'

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: placeholderColor,
        borderColor: placeholderColor,
        borderWidth: 1,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      {xml !== undefined && <SvgCss xml={xml} width={size} height={size} />}
    </View>
  )
}
