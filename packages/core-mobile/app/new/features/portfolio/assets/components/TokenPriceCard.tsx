import {
  ActivityIndicator,
  ANIMATED,
  MiniChart,
  PriceChangeIndicator,
  PriceChangeStatus,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useMarketToken } from 'common/hooks/useMarketToken'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { isEffectivelyZero } from 'features/track/utils/utils'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, { useCallback, useMemo } from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { LocalTokenWithBalance } from 'store/balance'

export const TokenPriceCard = ({
  token
}: {
  token: LocalTokenWithBalance
}): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const { getWatchlistChart, isLoadingTrendingTokens } = useWatchlist()

  const marketToken = useMarketToken({
    // Only resolve market token when token.change24 is missing
    token: token.change24 === undefined ? token : undefined
  })

  const percentChange =
    token.change24 ?? marketToken?.priceChangePercentage24h ?? undefined

  const priceChange =
    percentChange !== undefined && token.priceInCurrency !== undefined
      ? (token.priceInCurrency * percentChange) / 100
      : undefined

  const status =
    priceChange !== undefined
      ? priceChange > 0
        ? PriceChangeStatus.Up
        : priceChange < 0
        ? PriceChangeStatus.Down
        : PriceChangeStatus.Neutral
      : PriceChangeStatus.Neutral

  const formattedPriceChange = useMemo(() => {
    if (priceChange === undefined) return undefined

    const priceChangeInCurrency =
      (priceChange * (token.priceInCurrency ?? 0)) / 100
    const absPriceChange = Math.abs(priceChangeInCurrency)

    // for effectively zero price changes, return undefined
    // this is to avoid displaying "0.00" in the price change column
    if (isEffectivelyZero(absPriceChange)) {
      return undefined
    }

    return formatCurrency({
      amount: absPriceChange
    })
  }, [formatCurrency, priceChange, token.priceInCurrency])

  const formattedPercent = useMemo(
    () =>
      token.change24
        ? Math.abs(token.change24)?.toFixed(2).toString() + '%'
        : undefined,
    [token.change24]
  )

  const formattedPrice =
    priceChange !== undefined
      ? formatCurrency({ amount: Math.abs(priceChange) })
      : UNKNOWN_AMOUNT

  const chartStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isLoadingTrendingTokens ? 0 : 1, ANIMATED.TIMING_CONFIG)
  }))

  const renderChart = useCallback((): JSX.Element => {
    const { dataPoints, ranges } = getWatchlistChart(token.internalId ?? '')

    return (
      <View
        sx={{
          position: 'absolute',
          alignItems: 'flex-end',
          justifyContent: 'center',
          right: 30
        }}>
        {isLoadingTrendingTokens && (
          <View
            sx={{
              position: 'absolute',
              right: 0
            }}>
            <ActivityIndicator size="small" color={theme.colors.$textPrimary} />
          </View>
        )}
        <Animated.View style={chartStyle}>
          {dataPoints.length ? (
            <MiniChart
              style={{
                width: 90,
                height: 45
              }}
              data={dataPoints}
              negative={ranges.diffValue < 0}
            />
          ) : (
            <Text
              variant="subtitle2"
              sx={{ color: theme.colors.$textSecondary }}>
              No chart data
            </Text>
          )}
        </Animated.View>
      </View>
    )
  }, [
    getWatchlistChart,
    token.internalId,
    isLoadingTrendingTokens,
    theme.colors.$textPrimary,
    theme.colors.$textSecondary,
    chartStyle
  ])

  const renderPrice = useCallback((): JSX.Element => {
    if (priceChange === undefined && isLoadingTrendingTokens) {
      return (
        <ContentLoader
          speed={1}
          width={140}
          height={64}
          viewBox={`0 0 140 64`}
          backgroundColor={theme.isDark ? '#69696D' : '#D9D9D9'}
          foregroundColor={theme.isDark ? '#3E3E43' : '#F2F2F3'}>
          <Rect x="0" y="2" width={80} height={24} rx={6} ry={6} />
          <Rect x="0" y="30" width={110} height={14} rx={6} ry={6} />
          <Rect x="0" y="48" width={140} height={12} rx={6} ry={6} />
        </ContentLoader>
      )
    }
    const description =
      priceChange === undefined
        ? `No ${token.symbol} price available`
        : `Current ${token.symbol} price`

    return (
      <View>
        <Text variant="heading4" sx={{ color: theme.colors.$textPrimary }}>
          {formattedPrice}
        </Text>
        <PriceChangeIndicator
          formattedPrice={formattedPriceChange}
          status={status}
          formattedPercent={formattedPercent}
          textVariant="buttonMedium"
          animated={true}
        />
        <Text variant="subtitle2" sx={{ color: theme.colors.$textSecondary }}>
          {description}
        </Text>
      </View>
    )
  }, [
    formattedPercent,
    formattedPrice,
    formattedPriceChange,
    isLoadingTrendingTokens,
    priceChange,
    status,
    theme.colors.$textPrimary,
    theme.colors.$textSecondary,
    theme.isDark,
    token.symbol
  ])

  return (
    <View
      style={{
        backgroundColor: theme.colors.$surfaceSecondary,
        width: '100%',
        paddingHorizontal: 16,
        height: 90,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
      {renderPrice()}
      {renderChart()}
    </View>
  )
}
