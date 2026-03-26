import {
  AnimatedPressable,
  Icons,
  Image,
  Text,
  View,
  useTheme
} from '@avalabs/k2-alpine'
import type { TradableMarket } from '@avalabs/prediction-market-sdk'
import React from 'react'
import { MarketCardOption, MarketOption } from './MarketCardOption'

interface MarketCardProps {
  market: TradableMarket
  options: MarketOption[]
  onPress?: () => void
}

/**
 * Displays a single tradable Kalshi market card.
 *
 * Does NOT accept a width prop — fills its container.
 * In BrowseScreen, wrap each card in a View with sx={{ flex: 1, marginHorizontal: 7, marginBottom: 13 }}.
 *
 * Each option row renders a fill bar (proportional to probability) with the label
 * and percentage overlaid inside, matching the Figma masonry card design.
 */
export function MarketCard({
  market,
  options,
  onPress
}: MarketCardProps): JSX.Element {
  const { theme } = useTheme()

  const now = Date.now()
  const isLive =
    new Date(market.openTime).getTime() <= now &&
    now < new Date(market.closeTime).getTime()

  return (
    <AnimatedPressable
      onPress={onPress}
      style={{
        flex: 1,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.$borderPrimary,
        backgroundColor: theme.colors.$surfaceSecondary
      }}>
      <View
        sx={{
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 6,
          marginBottom: 8
        }}>
        {market.imageUrl ? (
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              backgroundColor: theme.colors.$surfacePrimary,
              borderWidth: 1,
              borderColor: theme.colors.$borderPrimary,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
            <Image
              source={{ uri: market.imageUrl }}
              style={{ width: 30, height: 30 }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                left: 0,
                top: 0,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
              <Icons.Custom.Prediction
                color={theme.colors.$textPrimary}
                width={16}
                height={16}
              />
            </View>
          </View>
        ) : null}
        {isLive ? (
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#ff2a6d',
              borderRadius: 100,
              borderWidth: 1,
              borderColor: theme.colors.$borderPrimary,
              paddingHorizontal: 6,
              gap: 4,
              height: 16,
              alignSelf: 'flex-start'
            }}>
            <View
              sx={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.colors.$white
              }}
            />
            <Text
              variant="caption"
              sx={{
                fontFamily: 'Inter-Medium',
                lineHeight: 12,
                color: theme.colors.$white
              }}>
              Live
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        variant="heading4"
        sx={{ marginBottom: 16, lineHeight: 22 }}
        numberOfLines={4}>
        {market.title ?? ''}
      </Text>

      <View sx={{ gap: 4 }}>
        {options.map(option => (
          <MarketCardOption key={option.label} option={option} />
        ))}
      </View>
    </AnimatedPressable>
  )
}
