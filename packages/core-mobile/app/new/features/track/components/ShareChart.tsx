import {
  ActivityIndicator,
  Logos,
  PriceChange,
  PriceChangeIndicator,
  PriceChangeStatus,
  Text,
  useInversedTheme,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useIsFocused } from '@react-navigation/native'
import { TokenLogo } from 'common/components/TokenLogo'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useTokenDetails } from 'common/hooks/useTokenDetails'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import SparklineChart from 'features/track/components/SparklineChart'
import { useGetPrices } from 'hooks/watchlist/useGetPrices'
import React, { useMemo } from 'react'
import { MarketToken } from 'store/watchlist'
import { formatLargeCurrency } from 'utils/Utils'
import { isEffectivelyZero } from '../utils/utils'

export const ShareChart = ({ token }: { token: MarketToken }): JSX.Element => {
  const { theme } = useTheme()
  const { theme: inversedTheme } = useInversedTheme({ isDark: theme.isDark })
  const { chartData, ranges, coingeckoId } = useTokenDetails({
    tokenId: token.id,
    marketType: token.marketType
  })
  const isFocused = useIsFocused()

  const { data: prices } = useGetPrices({
    coingeckoIds: [coingeckoId],
    enabled:
      isFocused && token?.currentPrice === undefined && coingeckoId.length > 0
  })

  return (
    <View
      sx={{
        width: CHART_IMAGE_SIZE,
        height: CHART_IMAGE_SIZE
      }}>
      <View
        sx={{
          backgroundColor: inversedTheme.colors.$surfacePrimary,
          height: '100%'
        }}>
        <View
          sx={{
            paddingTop: 36,
            paddingHorizontal: 40,
            paddingBottom: 4
          }}>
          <TokenHeader
            logoUri={token?.logoUri}
            symbol={token?.symbol ?? ''}
            currentPrice={
              token?.currentPrice ?? prices?.[coingeckoId]?.priceInCurrency
            }
            ranges={{
              diffValue: token?.priceChange24h ?? 0,
              percentChange: token?.priceChangePercentage24h ?? 0
            }}
          />
        </View>
        <View
          sx={{ flex: 1, position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          {(chartData ?? []).length === 0 ? (
            <View
              sx={{
                height: CHART_HEIGHT + VERTICAL_PADDING * 2,
                justifyContent: 'center'
              }}>
              <ActivityIndicator
                size={'large'}
                color={theme.colors.$surfacePrimary}
              />
            </View>
          ) : (
            <SparklineChart
              style={{
                height: CHART_HEIGHT + VERTICAL_PADDING * 2
              }}
              data={chartData ?? []}
              verticalPadding={VERTICAL_PADDING}
              negative={ranges.diffValue < 0}
              overrideTheme={inversedTheme}
            />
          )}
        </View>
      </View>
    </View>
  )
}

export const CHART_IMAGE_SIZE = 512

const TokenHeader = ({
  currentPrice,
  logoUri,
  symbol,
  ranges
}: {
  logoUri?: string
  currentPrice?: number
  ranges?: {
    diffValue: number
    percentChange: number
  }
  symbol: string
}): React.JSX.Element => {
  const { theme } = useTheme()
  const { theme: inversedTheme } = useInversedTheme({ isDark: theme.isDark })
  const { formatTokenInCurrency } = useFormatCurrency()

  const priceChange: PriceChange | undefined = useMemo(() => {
    if (ranges === undefined) return undefined

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
    <View>
      {logoUri !== undefined && (
        <TokenLogo symbol={symbol} logoUri={logoUri} size={64} />
      )}
      <View sx={{ position: 'absolute', top: 11, right: 10 }}>
        <Logos.AppIcons.Core color={inversedTheme.colors.$textPrimary} />
      </View>
      <View
        sx={{
          marginTop: 15,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
        <View>
          <Text
            variant="heading1"
            sx={{
              color: inversedTheme.colors.$textSecondary,
              fontFamily: 'Aeonik-Bold'
            }}
            numberOfLines={1}>
            {symbol.toUpperCase()}
          </Text>
          <View
            style={{
              flexDirection: 'column'
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <Text
                variant="heading1"
                sx={{
                  fontFamily: 'Aeonik-Bold',
                  color: inversedTheme.colors.$textPrimary
                }}>
                {currentPrice !== undefined
                  ? formatTokenInCurrency({ amount: currentPrice })
                  : UNKNOWN_AMOUNT}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View sx={{ opacity: priceChange ? 1 : 0, marginTop: 9 }}>
        <PriceChangeIndicator
          formattedPrice={priceChange?.formattedPrice}
          status={priceChange?.status ?? PriceChangeStatus.Neutral}
          formattedPercent={priceChange?.formattedPercent}
          textVariant="priceChangeIndicatorLarge"
          overrideTheme={inversedTheme}
        />
      </View>
    </View>
  )
}

const VERTICAL_PADDING = 24
const CHART_HEIGHT = 200
