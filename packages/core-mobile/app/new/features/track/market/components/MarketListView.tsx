import {
  Icons,
  PriceChangeIndicator,
  PriceChangeStatus,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { TokenLogo } from 'common/components/TokenLogo'
import React, { memo } from 'react'
import { MarketToken } from 'store/watchlist'

export const MarketListView = memo(
  ({
    token,
    isFavorite,
    onPress,
    formattedPrice,
    formattedPriceChange,
    formattedPercentChange,
    status
  }: {
    token: MarketToken
    isFavorite?: boolean
    formattedPrice: string
    formattedPriceChange?: string
    formattedPercentChange?: string
    status: PriceChangeStatus
    onPress: () => void
  }) => {
    const {
      theme: { colors }
    } = useTheme()

    return (
      <TouchableOpacity onPress={onPress}>
        <View
          sx={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: 'row'
          }}>
          <TokenLogo size={36} symbol={token.symbol} logoUri={token.logoUri} />
          <View
            style={{
              marginLeft: 16,
              marginRight: 16,
              flex: 1
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                flex: 1
              }}>
              <Text
                testID={`market_token__${token.name}`}
                variant="buttonMedium"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{ maxWidth: '45%' }}>
                {token.name}
              </Text>
              <Text
                variant="buttonMedium"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{
                  flex: 1,
                  textAlign: 'right'
                }}>
                {formattedPrice}
              </Text>
            </View>
            <View
              sx={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                flex: 1,
                marginTop: 2
              }}>
              <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  variant="body2"
                  sx={{ color: '$textSecondary', lineHeight: 18 }}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {token.symbol.toUpperCase()}
                </Text>
                {isFavorite && (
                  <Icons.Toggle.StarFilled
                    width={12}
                    height={12}
                    color="#FFB24C"
                  />
                )}
              </View>

              <PriceChangeIndicator
                formattedPrice={formattedPriceChange}
                formattedPercent={formattedPercentChange}
                status={status}
              />
            </View>
          </View>
          <View style={{ justifyContent: 'center' }}>
            <Icons.Navigation.ChevronRightV2 color={colors.$textPrimary} />
          </View>
        </View>
      </TouchableOpacity>
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
