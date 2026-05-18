import React, { FC, memo, useCallback, useMemo } from 'react'
import { LayoutChangeEvent, Pressable, View } from 'react-native'
import Animated, {
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { useTheme } from '../../../hooks'
import { Icons } from '../../../theme/tokens/Icons'
import { PriceChangeIndicator } from '../../PriceChangeIndicator/PriceChangeIndicator'
import { PriceChangeStatus } from '../../PriceChangeIndicator/types'
import { Text } from '../../Primitives'
import { DURATIONS } from './constants'
import { formatActiveTime } from './helpers'
import { useActiveIndex } from './hooks'
import { OhlcCandle } from './types'

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

const LEFT_ZONE_THRESHOLD = 0.19
const RIGHT_ZONE_THRESHOLD = 0.81

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

    const blockWidth = useSharedValue(0)
    const priceWidth = useSharedValue(0)
    const subtitleWidth = useSharedValue(0)
    const deltaWidth = useSharedValue(0)
    const progress = useSharedValue(0)
    // 0 = flex-start, 0.5 = center, 1 = flex-end.
    const innerAnchor = useSharedValue(0)

    useAnimatedReaction(
      () => isActive.value,
      active => {
        progress.value = withTiming(active ? 1 : 0, {
          duration: DURATIONS.headerPress
        })
      }
    )

    useAnimatedReaction(
      () => {
        const cw = containerWidth
        if (!isActive.value || cw <= 0) return 0
        const x = crosshairX.value
        if (x > RIGHT_ZONE_THRESHOLD * cw) return 1
        if (x > LEFT_ZONE_THRESHOLD * cw) return 0.5
        return 0
      },
      target => {
        innerAnchor.value = withTiming(target, {
          duration: DURATIONS.headerZone
        })
      }
    )

    const blockStyle = useAnimatedStyle(() => {
      const cw = containerWidth
      const w = blockWidth.value
      // Center the block on the crosshair, stopping 16px from each chart edge.
      const target = crosshairX.value - w / 2 - 16
      const minX = 0
      const maxX = Math.max(minX, cw - w - 32)
      const clamped = Math.max(minX, Math.min(maxX, target))
      return {
        transform: [{ translateX: clamped * progress.value }]
      }
    })

    const priceStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateX:
            innerAnchor.value * Math.max(0, blockWidth.value - priceWidth.value)
        }
      ]
    }))

    const subtitleStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateX:
            innerAnchor.value *
            Math.max(0, blockWidth.value - subtitleWidth.value)
        }
      ]
    }))

    const deltaStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateX:
            innerAnchor.value * Math.max(0, blockWidth.value - deltaWidth.value)
        }
      ]
    }))

    const chevronStyle = useAnimatedStyle(() => ({
      opacity: 1 - progress.value
    }))

    const onBlockLayout = useCallback(
      (e: LayoutChangeEvent) => {
        blockWidth.value = e.nativeEvent.layout.width
      },
      [blockWidth]
    )

    const onPriceLayout = useCallback(
      (e: LayoutChangeEvent) => {
        priceWidth.value = e.nativeEvent.layout.width
      },
      [priceWidth]
    )

    const onSubtitleLayout = useCallback(
      (e: LayoutChangeEvent) => {
        subtitleWidth.value = e.nativeEvent.layout.width
      },
      [subtitleWidth]
    )

    const onDeltaLayout = useCallback(
      (e: LayoutChangeEvent) => {
        deltaWidth.value = e.nativeEvent.layout.width
      },
      [deltaWidth]
    )

    // Pre-compute display strings once per `candles` ref so per-frame
    // re-renders during drag are array lookups — no Date/toLocaleString work.
    const formatted = useMemo(() => {
      const firstOpen = candles[0]?.open ?? 0
      return candles.map(c => {
        const close = Number.isFinite(c.close) ? c.close : 0
        const delta = close - firstOpen
        const deltaPct =
          Number.isFinite(firstOpen) && firstOpen !== 0
            ? (delta / firstOpen) * 100
            : 0
        const safeDelta = Number.isFinite(delta) ? delta : 0
        const safeDeltaPct = Number.isFinite(deltaPct) ? deltaPct : 0
        const status =
          safeDelta > 0
            ? PriceChangeStatus.Up
            : safeDelta < 0
            ? PriceChangeStatus.Down
            : PriceChangeStatus.Neutral
        return {
          priceText: formatPrice(close),
          timeText: formatActiveTime(c.ts),
          deltaPriceText: formatPrice(Math.abs(safeDelta)),
          deltaPctText: `${Math.abs(safeDeltaPct).toFixed(2)}%`,
          status
        }
      })
    }, [candles, formatPrice])

    const idleStrings = formatted[formatted.length - 1]
    const active = idx !== null ? formatted[idx] : undefined
    const displayed = active ?? idleStrings

    return (
      <View style={{ paddingHorizontal: 16, alignItems: 'flex-start' }}>
        <Animated.View
          onLayout={onBlockLayout}
          style={[blockStyle, { alignItems: 'flex-start' }]}>
          <Animated.View onLayout={onPriceLayout} style={priceStyle}>
            {onPriceHeaderPress ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="View token details"
                  onPress={onPriceHeaderPress}>
                  <Text variant="heading3">
                    {displayed?.priceText ?? formatPrice(0)}
                  </Text>
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
                      chevronStyle
                    ]}>
                    <Icons.Navigation.ChevronRight
                      color={theme.colors.$textSecondary}
                      width={20}
                      height={20}
                    />
                  </Animated.View>
                </Pressable>
              </>
            ) : (
              <Text variant="heading3">
                {displayed?.priceText ?? formatPrice(0)}
              </Text>
            )}
          </Animated.View>
          <Animated.View onLayout={onSubtitleLayout} style={subtitleStyle}>
            <Text variant="subtitle2" sx={{ color: '$textSecondary' }}>
              {active ? active.timeText : `Current price of ${symbol}`}
            </Text>
          </Animated.View>
          <Animated.View onLayout={onDeltaLayout} style={deltaStyle}>
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
