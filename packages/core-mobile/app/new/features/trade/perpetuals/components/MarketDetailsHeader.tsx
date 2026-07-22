import { PriceChangeIndicator, Text, useTheme, View } from '@avalabs/k2-alpine'
import type { PerpUniverseEntry, PerpsAssetCtx } from '@avalabs/perps-sdk'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import React from 'react'
import Animated from 'react-native-reanimated'
import { Rect } from 'react-content-loader/native'
import { usePriceFlash } from '../hooks/usePriceFlash'
import { dexOfCoin, tickerOfCoin } from '../utils/coinDex'
import { computePriceChange, formatPercent } from '../utils/priceChange'
import { DexBadge } from './DexBadge'
import { PerpsCoinLogo } from './PerpsCoinLogo'
import { Skeleton } from './Skeleton'

const DASH = '—'

interface MarketDetailsHeaderProps {
  coin: string
  assetCtx?: PerpsAssetCtx
  universe?: PerpUniverseEntry
}

export const MarketDetailsHeader = ({
  coin,
  assetCtx,
  universe
}: MarketDetailsHeaderProps): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()

  const { markPx, pct, status } = computePriceChange(assetCtx)

  // Blink green/red as the live WS `markPx` ticks up/down.
  const flashStyle = usePriceFlash(markPx ?? 0)

  const formattedPrice =
    markPx !== undefined ? formatCurrency({ amount: markPx }) : DASH
  const formattedChangePct = formatPercent(pct) ?? DASH
  const formattedLeverage =
    universe?.maxLeverage !== undefined ? `${universe.maxLeverage}×` : DASH

  return (
    <View
      sx={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingTop: 8
      }}>
      <View sx={{ gap: 4 }}>
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <PerpsCoinLogo symbol={coin} size={40} />
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text variant="heading2" sx={{ color: '$textSecondary' }}>
              {tickerOfCoin(coin)}
            </Text>
            <DexBadge dex={dexOfCoin(coin)} />
          </View>
        </View>
        {assetCtx === undefined ? (
          <Skeleton width={180} height={52}>
            {/* mark price (heading2) */}
            <Rect x="0" y="0" rx="6" ry="6" width="140" height="32" />
            {/* 24h change indicator */}
            <Rect x="0" y="38" rx="6" ry="6" width="90" height="14" />
          </Skeleton>
        ) : (
          <>
            <Animated.View
              style={[
                {
                  borderRadius: 6,
                  paddingHorizontal: 4,
                  alignSelf: 'flex-start'
                },
                flashStyle
              ]}>
              <Text variant="heading2">{formattedPrice}</Text>
            </Animated.View>
            <PriceChangeIndicator
              status={status}
              formattedPercent={formattedChangePct}
            />
          </>
        )}
      </View>

      {universe?.maxLeverage === undefined ? (
        <Skeleton width={110} height={68}>
          {/* "Leverage up to Nx" badge box */}
          <Rect x="0" y="0" rx="12" ry="12" width="110" height="68" />
        </Skeleton>
      ) : (
        <View
          sx={{
            borderWidth: 2,
            borderColor: theme.colors.$textSecondary,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            alignItems: 'center'
          }}>
          <Text variant="heading2" sx={{ color: '$textSecondary' }}>
            {formattedLeverage}
          </Text>
          <Text variant="caption" sx={{ color: '$textSecondary' }}>
            Leverage up to
          </Text>
        </View>
      )}
    </View>
  )
}
