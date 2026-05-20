import React, { FC, memo, useCallback, useMemo } from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { LayoutChangeEvent, Pressable, View, ViewStyle } from 'react-native'
import Animated, {
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import type { AnimatedStyle } from 'react-native-reanimated'
import { useTheme } from '../../../hooks'
import { Icons } from '../../../theme/tokens/Icons'
import { PriceChangeIndicator } from '../../PriceChangeIndicator/PriceChangeIndicator'
import { PriceChangeStatus } from '../../PriceChangeIndicator/types'
import { Text } from '../../Primitives'
import { DURATIONS } from './constants'
import {
  crosshairInnerAnchorTarget,
  formatCandleDisplayStrings
} from './helpers'
import { useActiveIndex } from './hooks'
import { OhlcCandle } from './types'

const useLayoutWidthHandler = (
  width: SharedValue<number>
): ((e: LayoutChangeEvent) => void) =>
  useCallback(
    (e: LayoutChangeEvent) => {
      width.value = e.nativeEvent.layout.width
    },
    [width]
  )

const useAnchorTranslateStyle = (
  innerAnchor: SharedValue<number>,
  blockWidth: SharedValue<number>,
  elementWidth: SharedValue<number>
): AnimatedStyle<ViewStyle> =>
  useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          innerAnchor.value * Math.max(0, blockWidth.value - elementWidth.value)
      }
    ]
  }))

type ChartHeaderAnimations = {
  blockStyle: AnimatedStyle<ViewStyle>
  priceStyle: AnimatedStyle<ViewStyle>
  subtitleStyle: AnimatedStyle<ViewStyle>
  deltaStyle: AnimatedStyle<ViewStyle>
  chevronStyle: AnimatedStyle<ViewStyle>
  onBlockLayout: (e: LayoutChangeEvent) => void
  onPriceLayout: (e: LayoutChangeEvent) => void
  onSubtitleLayout: (e: LayoutChangeEvent) => void
  onDeltaLayout: (e: LayoutChangeEvent) => void
}

const useChartHeaderAnimations = (
  containerWidth: number,
  crosshairX: SharedValue<number>,
  isActive: SharedValue<boolean>
): ChartHeaderAnimations => {
  const blockWidth = useSharedValue(0)
  const priceWidth = useSharedValue(0)
  const subtitleWidth = useSharedValue(0)
  const deltaWidth = useSharedValue(0)
  const progress = useSharedValue(0)
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
    () =>
      crosshairInnerAnchorTarget(
        isActive.value,
        crosshairX.value,
        containerWidth
      ),
    target => {
      innerAnchor.value = withTiming(target, {
        duration: DURATIONS.headerZone
      })
    }
  )

  const blockStyle = useAnimatedStyle(() => {
    const cw = containerWidth
    const w = blockWidth.value
    const target = crosshairX.value - w / 2 - 16
    const minX = 0
    const maxX = Math.max(minX, cw - w - 32)
    const clamped = Math.max(minX, Math.min(maxX, target))
    return {
      transform: [{ translateX: clamped * progress.value }]
    }
  })

  const priceStyle = useAnchorTranslateStyle(
    innerAnchor,
    blockWidth,
    priceWidth
  )
  const subtitleStyle = useAnchorTranslateStyle(
    innerAnchor,
    blockWidth,
    subtitleWidth
  )
  const deltaStyle = useAnchorTranslateStyle(
    innerAnchor,
    blockWidth,
    deltaWidth
  )

  const chevronStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value
  }))

  return {
    blockStyle,
    priceStyle,
    subtitleStyle,
    deltaStyle,
    chevronStyle,
    onBlockLayout: useLayoutWidthHandler(blockWidth),
    onPriceLayout: useLayoutWidthHandler(priceWidth),
    onSubtitleLayout: useLayoutWidthHandler(subtitleWidth),
    onDeltaLayout: useLayoutWidthHandler(deltaWidth)
  }
}

type Props = {
  candles: OhlcCandle[]
  symbol: string
  activeIndex: SharedValue<number | null>
  crosshairX: SharedValue<number>
  isActive: SharedValue<boolean>
  containerWidth: number
  onPriceHeaderPress?: () => void
  formatPrice?: (amount: number) => string
  isLoading?: boolean
  /** Idle-state (non-crosshair) values. The crosshair-active state reads
   * from the candle at the active index regardless of these. */
  priceText?: string
  priceChange?: {
    status: PriceChangeStatus
    formattedPrice?: string
    formattedPercent?: string
  }
}

const defaultFormatPrice = (amount: number): string =>
  `$${(Number.isFinite(amount) ? amount : 0).toFixed(2)}`

const UNKNOWN_PRICE_TEXT = '–'

const SKELETON_WIDTH = 160
const SKELETON_HEIGHT = 62

const ChartHeaderSkeleton: FC = () => {
  const {
    theme: { isDark }
  } = useTheme()
  const backgroundColor = isDark ? '#3E3E43' : '#F2F2F3'
  const foregroundColor = isDark ? '#69696D' : '#D9D9D9'

  return (
    <ContentLoader
      speed={1}
      width={SKELETON_WIDTH}
      height={SKELETON_HEIGHT}
      viewBox={`0 0 ${SKELETON_WIDTH} ${SKELETON_HEIGHT}`}
      backgroundColor={backgroundColor}
      foregroundColor={foregroundColor}>
      <Rect x="0" y="0" rx="6" ry="6" width="140" height="22" />
      <Rect x="0" y="28" rx="6" ry="6" width="120" height="12" />
      <Rect x="0" y="46" rx="6" ry="6" width="100" height="14" />
    </ContentLoader>
  )
}

export const ChartHeader: FC<Props> = memo(
  ({
    candles,
    symbol,
    activeIndex,
    crosshairX,
    isActive,
    containerWidth,
    onPriceHeaderPress,
    formatPrice = defaultFormatPrice,
    isLoading = false,
    priceText: idlePriceText,
    priceChange: idlePriceChange
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

    const lastCandle = formatted[formatted.length - 1]
    const active = idx !== null ? formatted[idx] : undefined

    const priceText =
      active?.priceText ??
      idlePriceText ??
      lastCandle?.priceText ??
      UNKNOWN_PRICE_TEXT
    const subtitleText = active ? active.timeText : `Current price of ${symbol}`
    const indicator = active
      ? {
          status: active.status,
          formattedPrice: active.deltaPriceText,
          formattedPercent: active.deltaPctText
        }
      : idlePriceChange ??
        (lastCandle
          ? {
              status: lastCandle.status,
              formattedPrice: lastCandle.deltaPriceText,
              formattedPercent: lastCandle.deltaPctText
            }
          : undefined)

    return (
      <View
        style={{
          paddingHorizontal: 16,
          alignItems: 'flex-start'
        }}>
        {isLoading ? (
          <ChartHeaderSkeleton />
        ) : (
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
              {indicator ? (
                <PriceChangeIndicator
                  status={indicator.status}
                  formattedPrice={indicator.formattedPrice}
                  formattedPercent={indicator.formattedPercent}
                  textVariant="buttonSmall"
                  percentSx={{ fontSize: 14, lineHeight: 18 }}
                  priceSx={{ fontSize: 14, lineHeight: 18 }}
                />
              ) : (
                <Text variant="buttonSmall" sx={{ color: '$textSecondary' }}>
                  {'-'}
                </Text>
              )}
            </Animated.View>
          </Animated.View>
        )}
      </View>
    )
  }
)
