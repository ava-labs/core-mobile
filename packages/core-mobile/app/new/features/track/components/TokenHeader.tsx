import {
  PriceChange,
  PriceChangeIndicator,
  PriceChangeStatus,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { TokenLogo } from 'common/components/TokenLogo'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import React, { useMemo } from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { LayoutChangeEvent } from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition
} from 'react-native-reanimated'
import { formatLargeCurrency } from 'utils/Utils'
import { isEffectivelyZero } from '../utils/utils'
import { RankView } from './RankView'

export const TokenHeader = ({
  name,
  currentPrice,
  logoUri,
  symbol,
  ranges,
  rank,
  onLayout
}: {
  name: string
  logoUri?: string
  currentPrice?: number
  ranges?: {
    diffValue: number
    percentChange: number
  }
  symbol: string
  rank?: number
  onLayout?: (event: LayoutChangeEvent) => void
}): React.JSX.Element => {
  const { formatTokenInCurrency } = useFormatCurrency()

  const priceChange: PriceChange | undefined = useMemo(() => {
    if (ranges === undefined) {
      return undefined
    }

    const absPriceChange = Math.abs(ranges.diffValue)

    // for effectively zero price changes, return undefined
    // this is to avoid displaying "0.00" in the price change column
    const formattedPrice = isEffectivelyZero(absPriceChange)
      ? undefined
      : formatLargeCurrency(formatTokenInCurrency({ amount: absPriceChange }))

    return {
      formattedPrice,
      status:
        ranges.diffValue < 0
          ? PriceChangeStatus.Down
          : ranges.diffValue === 0
          ? PriceChangeStatus.Neutral
          : PriceChangeStatus.Up,
      formattedPercent: `${ranges.percentChange.toFixed(2).replace('-', '')}%`
    }
  }, [ranges, formatTokenInCurrency])

  return (
    <View onLayout={onLayout}>
      <TokenLogo symbol={symbol} logoUri={logoUri} size={42} />

      <View style={{ marginTop: 15, marginBottom: 5 }}>
        {name.toLowerCase() !== symbol.toLowerCase() ? (
          <Text
            variant="heading2"
            sx={{ color: '$textSecondary', lineHeight: 38 }}
            numberOfLines={1}>
            {name}
          </Text>
        ) : null}
        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
          <View>
            <Text
              variant="heading2"
              numberOfLines={1}
              sx={{
                color:
                  name.toLowerCase() === symbol.toLowerCase()
                    ? '$textSecondary'
                    : '$textPrimary',
                lineHeight: 38
              }}>
              {symbol.toUpperCase()}
            </Text>

            <View
              style={{
                flexDirection: 'column'
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <Text
                  variant="heading2"
                  sx={{
                    lineHeight: 38
                  }}>
                  {currentPrice !== undefined
                    ? formatTokenInCurrency({ amount: currentPrice })
                    : UNKNOWN_AMOUNT}
                </Text>
              </View>
            </View>
          </View>
          {rank !== undefined && rank > 0 && rank < 100 && (
            <Animated.View entering={FadeIn}>
              <RankView rank={rank} sx={{ marginRight: 10 }} />
            </Animated.View>
          )}
        </View>
      </View>

      <PriceChangeIndicator
        formattedPrice={priceChange?.formattedPrice}
        status={priceChange?.status ?? PriceChangeStatus.Neutral}
        formattedPercent={priceChange?.formattedPercent}
        textVariant="buttonMedium"
        animated={true}
      />
      {/* <View sx={{ opacity: priceChange ? 1 : 0, marginTop: 5 }}>
        <PriceChangeIndicator
          formattedPrice={priceChange?.formattedPrice}
          status={priceChange?.status ?? PriceChangeStatus.Neutral}
          formattedPercent={priceChange?.formattedPercent}
          textVariant="buttonMedium"
          animated={true}
        />
      </View> */}
    </View>
  )
}

export const SkeletonLoader = ({
  width,
  height,
  items,
  isLoading = false,
  children
}: {
  width: number
  height: number
  items: {
    x: number
    y: number
    width: number
    height: number
    borderRadius?: number
  }[]
  isLoading?: boolean
  children: React.ReactNode
}): React.JSX.Element => {
  const {
    theme: { isDark }
  } = useTheme()
  const backgroundColor = isDark ? '#3E3E43' : '#F2F2F3'
  const foregroundColor = isDark ? '#69696D' : '#D9D9D9'

  return (
    <View>
      {isLoading ? (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          exiting={FadeOut}
          layout={LinearTransition.springify()}>
          <ContentLoader
            speed={1}
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            backgroundColor={backgroundColor}
            foregroundColor={foregroundColor}>
            {items?.map((item, index) => (
              <Rect
                key={index}
                x={item.x}
                y={item.y}
                rx={item?.borderRadius ?? 8}
                ry={item?.borderRadius ?? 8}
                width={item.width}
                height={item.height}
              />
            ))}
          </ContentLoader>
        </Animated.View>
      ) : (
        <Animated.View layout={LinearTransition.springify()} entering={FadeIn}>
          {children}
        </Animated.View>
      )}
    </View>
  )
}
