import React, { FC, memo, useMemo } from 'react'
import { Pressable, View } from 'react-native'
import Animated, { SharedValue } from 'react-native-reanimated'
import { useTheme } from '../../../hooks'
import { Icons } from '../../../theme/tokens/Icons'
import { PriceChangeIndicator } from '../../PriceChangeIndicator/PriceChangeIndicator'
import { PriceChangeStatus } from '../../PriceChangeIndicator/types'
import { Text } from '../../Primitives'
import { formatCandleDisplayStrings } from './helpers'
import { useActiveIndex } from './hooks'
import { OhlcCandle } from './types'
import { useChartHeaderAnimations } from './useChartHeaderAnimations'

type Props = {
  candles: OhlcCandle[]
  symbol: string
  activeIndex: SharedValue<number | null>
  crosshairX: SharedValue<number>
  isActive: SharedValue<boolean>
  containerWidth: number
  /** When provided, renders a chevron next to the price; tapping the price row fires it. */
  onPriceHeaderPress?: () => void
  /** Locale + currency-aware money formatter. Falls back to `$X.XX` when omitted. */
  formatPrice?: (amount: number) => string
}

const defaultFormatPrice = (amount: number): string =>
  `$${(Number.isFinite(amount) ? amount : 0).toFixed(2)}`

export const ChartHeader: FC<Props> = memo(
  ({
    candles,
    symbol,
    activeIndex,
    crosshairX,
    isActive,
    containerWidth,
    onPriceHeaderPress,
    formatPrice = defaultFormatPrice
  }) => {
    const { theme } = useTheme()
    const idx = useActiveIndex(activeIndex)
    const animations = useChartHeaderAnimations(
      containerWidth,
      crosshairX,
      isActive
    )

    const formatted = useMemo(
      () => formatCandleDisplayStrings(candles, formatPrice),
      [candles, formatPrice]
    )

    const idleStrings = formatted[formatted.length - 1]
    const active = idx !== null ? formatted[idx] : undefined
    const displayed = active ?? idleStrings
    const priceText = displayed?.priceText ?? formatPrice(0)
    const subtitleText = active ? active.timeText : `Current price of ${symbol}`

    return (
      <View style={{ paddingHorizontal: 16, alignItems: 'flex-start' }}>
        <Animated.View
          onLayout={animations.onBlockLayout}
          style={[animations.blockStyle, { alignItems: 'flex-start' }]}>
          <Animated.View
            onLayout={animations.onPriceLayout}
            style={animations.priceStyle}>
            {onPriceHeaderPress ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View token details"
                onPress={onPriceHeaderPress}>
                <Text variant="heading3">{priceText}</Text>
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      left: '100%',
                      top: 0,
                      bottom: 0,
                      marginLeft: 4,
                      justifyContent: 'center'
                    },
                    animations.chevronStyle
                  ]}>
                  <Icons.Navigation.ChevronRight
                    color={theme.colors.$textSecondary}
                    width={20}
                    height={20}
                  />
                </Animated.View>
              </Pressable>
            ) : (
              <Text variant="heading3">{priceText}</Text>
            )}
          </Animated.View>
          <Animated.View
            onLayout={animations.onSubtitleLayout}
            style={animations.subtitleStyle}>
            <Text variant="subtitle2" sx={{ color: '$textSecondary' }}>
              {subtitleText}
            </Text>
          </Animated.View>
          <Animated.View
            onLayout={animations.onDeltaLayout}
            style={animations.deltaStyle}>
            <PriceChangeIndicator
              status={displayed?.status ?? PriceChangeStatus.Neutral}
              formattedPrice={displayed?.deltaPriceText ?? formatPrice(0)}
              formattedPercent={displayed?.deltaPctText ?? '0.00%'}
              textVariant="buttonSmall"
              percentSx={{ fontSize: 14, lineHeight: 18 }}
              priceSx={{ fontSize: 14, lineHeight: 18 }}
            />
          </Animated.View>
        </Animated.View>
      </View>
    )
  }
)
