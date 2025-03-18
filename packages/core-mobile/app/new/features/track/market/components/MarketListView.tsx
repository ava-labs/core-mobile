import React, { memo } from 'react'
import {
  alpha,
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
import { TokenLogo } from 'features/portfolio/assets/components/TokenLogo'

export const MarketListView = memo(
  ({
    token,
    isFavorite,
    index,
    onPress,
    formattedPrice,
    formattedPriceChange,
    formattedPercentChange,
    status
  }: {
    token: MarketToken
    isFavorite?: boolean
    index: number
    formattedPrice: string
    formattedPriceChange: string
    formattedPercentChange?: string
    status: PriceChangeStatus
    onPress: () => void
  }) => {
    const {
      theme: { colors, isDark }
    } = useTheme()
    const borderColor = isDark ? colors.$borderPrimary : alpha('#000000', 0.15)

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
              <TokenLogo
                size={36}
                symbol={token.symbol}
                logoUri={token.logoUri}
                backgroundColor={colors.$borderPrimary}
                borderColor={borderColor}
              />
              <View sx={{ flexShrink: 1 }}>
                <Text
                  variant="buttonMedium"
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {token.name}
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
                  formattedPrice={formattedPriceChange}
                  formattedPercent={formattedPercentChange}
                  status={status}
                />
              </View>
              <Icons.Navigation.ChevronRightV2 color={colors.$textPrimary} />
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
        prevProps.formattedPriceChange === nextProps.formattedPriceChange ||
        prevProps.formattedPercentChange === nextProps.formattedPercentChange ||
        prevProps.isFavorite === nextProps.isFavorite)
    )
  }
)
