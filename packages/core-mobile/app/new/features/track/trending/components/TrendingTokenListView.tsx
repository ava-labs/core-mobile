import React, { memo, useCallback, useMemo } from 'react'
import { StyleSheet } from 'react-native'
import {
  alpha,
  Button,
  Icons,
  PriceChangeIndicator,
  PriceChangeStatus,
  SPRING_LINEAR_TRANSITION,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import Animated from 'react-native-reanimated'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { MarketToken } from 'store/watchlist'
import { TokenLogo } from 'common/components/TokenLogo'

const logoSize = 36

export const TrendingTokenListView = memo(
  ({
    token,
    isFavorite,
    index,
    onPress,
    formattedPrice,
    formattedPercentChange,
    status
  }: {
    token: MarketToken
    isFavorite?: boolean
    index: number
    formattedPrice: string
    formattedPercentChange?: string
    status: PriceChangeStatus
    onPress: () => void
  }) => {
    const {
      theme: { colors, isDark }
    } = useTheme()

    const borderColor = useMemo(
      () => (isDark ? colors.$borderPrimary : alpha('#000000', 0.15)),
      [colors, isDark]
    )

    const renderLogo = useCallback(() => {
      if (index === 0) {
        return (
          <View>
            <TokenLogo
              size={logoSize}
              symbol={token.symbol}
              logoUri={token.logoUri}
              backgroundColor={colors.$borderPrimary}
              borderColor={borderColor}
            />
            <View style={styles.crownContainer}>
              <Text variant="heading6">👑</Text>
            </View>
          </View>
        )
      }

      return (
        <TokenLogo
          size={logoSize}
          symbol={token.symbol}
          logoUri={token.logoUri}
          backgroundColor={colors.$borderPrimary}
          borderColor={borderColor}
        />
      )
    }, [index, token.logoUri, token.symbol, colors, borderColor])

    return (
      <Animated.View
        entering={getListItemEnteringAnimation(index)}
        layout={SPRING_LINEAR_TRANSITION}>
        <TouchableOpacity onPress={onPress}>
          <View
            sx={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
            <View
              sx={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                flex: 1
              }}>
              {renderLogo()}
              <View sx={{ flexShrink: 1 }}>
                <Text
                  variant="buttonMedium"
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {index + 1}. {token.name}
                </Text>
                <View
                  sx={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text
                    variant="body2"
                    sx={{ color: '$textSecondary', lineHeight: 18 }}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {token.symbol.toUpperCase()}
                  </Text>
                  {isFavorite && (
                    <Icons.Toggle.StarFilled width={12} height={12} />
                  )}
                </View>
              </View>
            </View>
            <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
              <View
                sx={{
                  justifyContent: 'flex-end',
                  alignItems: 'flex-end'
                }}>
                <Text
                  variant="buttonMedium"
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {formattedPrice}
                </Text>
                <PriceChangeIndicator
                  formattedPercent={formattedPercentChange}
                  status={status}
                />
              </View>
              <Button type="secondary" size="small" style={{ width: 72 }}>
                Buy
              </Button>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.token.id === nextProps.token.id &&
      (prevProps.formattedPrice === nextProps.formattedPrice ||
        prevProps.formattedPercentChange === nextProps.formattedPercentChange ||
        prevProps.isFavorite === nextProps.isFavorite)
    )
  }
)

const styles = StyleSheet.create({
  crownContainer: {
    position: 'absolute',
    top: '-28%',
    left: '50%',
    transform: [{ rotate: '28deg' }]
  }
})
