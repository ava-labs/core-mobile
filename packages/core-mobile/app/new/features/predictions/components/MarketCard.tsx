import React, { useMemo } from 'react'
import { Image, Pressable, Text, View, useTheme } from '@avalabs/k2-alpine'
import type { TradableMarket } from '@avalabs/prediction-market-sdk'

// No StyleSheet — use sx prop for static values, style prop for dynamic values.

interface MarketCardProps {
  market: TradableMarket
  onPress?: () => void
}

/**
 * Displays a single tradable Kalshi market card.
 *
 * Does NOT accept a width prop — fills its container.
 * In BrowseScreen, wrap each card in a View with sx={{ flex: 1, marginHorizontal: 7, marginBottom: 13 }}.
 *
 * Probability is derived from minAskPrice (best available ask = market price).
 */
export function MarketCard({ market, onPress }: MarketCardProps): JSX.Element {
  const { theme } = useTheme()

  const now = Date.now()
  const isLive =
    new Date(market.openTime).getTime() <= now &&
    now < new Date(market.closeTime).getTime()

  const yesProb = useMemo(
    () => Math.min(1, Math.max(0, parseFloat(market.yesQuote.minAskPrice))),
    [market.yesQuote.minAskPrice]
  )
  const noProb = useMemo(
    () => Math.min(1, Math.max(0, parseFloat(market.noQuote.minAskPrice))),
    [market.noQuote.minAskPrice]
  )

  const expiryLabel = useMemo(
    () =>
      new Date(market.expectedExpirationTime).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
    [market.expectedExpirationTime]
  )

  const yesFill = `rgba(31, 169, 94, ${(0.2 + yesProb * 0.4).toFixed(2)})`
  const noFill = `rgba(40, 40, 46, ${(0.1 + noProb * 0.15).toFixed(2)})`

  return (
    <Pressable
      onPress={onPress}
      sx={{
        flex: 1,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)'
      }}
      style={{ backgroundColor: theme.colors.$surfaceSecondary }}>
      {/* Thumbnail + Live badge */}
      <View
        sx={{
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 6,
          marginBottom: 8
        }}>
        {market.imageUrl ? (
          <Image
            source={{ uri: market.imageUrl }}
            sx={{ width: 30, height: 30, borderRadius: 8 }}
            resizeMode="cover"
          />
        ) : null}
        {isLive ? (
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#ff2a6d',
              borderRadius: 100,
              paddingHorizontal: 6,
              paddingVertical: 2,
              gap: 4,
              alignSelf: 'flex-start'
            }}>
            <View
              sx={{
                width: 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: '#ffffff'
              }}
            />
            <Text variant="caption" sx={{ color: '#ffffff' }}>
              Live
            </Text>
          </View>
        ) : null}
      </View>

      {/* Title */}
      <Text variant="heading4" sx={{ marginBottom: 12 }} numberOfLines={4}>
        {market.title ?? ''}
      </Text>

      {/* Probability bars */}
      <View sx={{ gap: 4, marginBottom: 10 }}>
        {/* Yes */}
        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 24,
            gap: 6
          }}>
          <Text variant="caption" sx={{ width: 22 }}>
            Yes
          </Text>
          <View
            sx={{
              flex: 1,
              height: 24,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: 'rgba(40,40,46,0.06)'
            }}>
            <View
              style={{
                width: `${Math.round(yesProb * 100)}%`,
                height: '100%',
                borderRadius: 8,
                backgroundColor: yesFill
              }}
            />
          </View>
          <Text variant="buttonSmall" sx={{ width: 32, textAlign: 'right' }}>
            {Math.round(yesProb * 100)}%
          </Text>
        </View>

        {/* No */}
        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 24,
            gap: 6
          }}>
          <Text variant="caption" sx={{ width: 22 }}>
            No
          </Text>
          <View
            sx={{
              flex: 1,
              height: 24,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: 'rgba(40,40,46,0.06)'
            }}>
            <View
              style={{
                width: `${Math.round(noProb * 100)}%`,
                height: '100%',
                borderRadius: 8,
                backgroundColor: noFill
              }}
            />
          </View>
          <Text variant="buttonSmall" sx={{ width: 32, textAlign: 'right' }}>
            {Math.round(noProb * 100)}%
          </Text>
        </View>
      </View>

      {/* Expiry */}
      <Text variant="caption" sx={{ opacity: 0.5 }}>
        {expiryLabel}
      </Text>
    </Pressable>
  )
}
