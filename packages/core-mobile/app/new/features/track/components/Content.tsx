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
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React from 'react'
import { useTokenDetails } from 'screens/watchlist/useTokenDetails'
import { formatLargeCurrency } from 'utils/Utils'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { TokenLogo } from 'features/portfolio/assets/components/TokenLogo'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import SparklineChart from 'features/track/components/SparklineChart'

export const Content = ({
  tokenId,
  scale
}: {
  tokenId: string
  scale: number
}): JSX.Element => {
  const { theme } = useTheme()
  const { theme: inversedTheme } = useInversedTheme({ isDark: theme.isDark })
  const { chartData, ranges } = useTokenDetails(tokenId ?? '')
  const { getMarketTokenById } = useWatchlist()
  const token = tokenId ? getMarketTokenById(tokenId) : undefined

  return (
    <View
      sx={{
        width: CONTENT_SIZE,
        height: CONTENT_SIZE,
        borderRadius: 18 / scale,
        borderWidth: 1,
        borderColor: theme.colors.$borderPrimary,
        overflow: 'hidden'
      }}>
      {/* {isLoading === false ? ( */}
      {!token || (chartData ?? []).length === 0 ? (
        <View
          sx={{
            backgroundColor: theme.colors.$surfaceSecondary,
            height: '100%',
            justifyContent: 'center'
          }}>
          <ActivityIndicator size={'large'} />
        </View>
      ) : (
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
              logoUri={token.logoUri}
              symbol={token.symbol}
              currentPrice={token.currentPrice}
              ranges={
                ranges.minDate === 0 && ranges.maxDate === 0
                  ? undefined
                  : ranges
              }
            />
          </View>
          <SparklineChart
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: CHART_HEIGHT + VERTICAL_PADDING * 2
            }}
            data={chartData ?? []}
            verticalPadding={VERTICAL_PADDING}
            negative={ranges.diffValue < 0}
            overrideTheme={inversedTheme}
          />
        </View>
      )}
    </View>
  )
}

export const CONTENT_SIZE = 512

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

  const priceChange: PriceChange | undefined =
    ranges === undefined
      ? undefined
      : {
          formattedPrice: formatLargeCurrency(
            formatTokenInCurrency(Math.abs(ranges.diffValue))
          ),
          status:
            ranges.diffValue < 0
              ? PriceChangeStatus.Down
              : ranges.diffValue === 0
              ? PriceChangeStatus.Neutral
              : PriceChangeStatus.Up,
          formattedPercent: `${ranges.percentChange
            .toFixed(2)
            .replace('-', '')}%`
        }

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
                  ? formatTokenInCurrency(currentPrice)
                  : UNKNOWN_AMOUNT}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View sx={{ opacity: priceChange ? 1 : 0, marginTop: 5 }}>
        <PriceChangeIndicator
          formattedPrice={priceChange?.formattedPrice ?? UNKNOWN_AMOUNT}
          status={priceChange?.status ?? PriceChangeStatus.Neutral}
          formattedPercent={priceChange?.formattedPercent ?? UNKNOWN_AMOUNT}
          textVariant="buttonMedium"
          overrideTheme={inversedTheme}
        />
      </View>
    </View>
  )
}

const VERTICAL_PADDING = 24
const CHART_HEIGHT = 200
