import {
  Button,
  Icons,
  PriceChangeIndicator,
  PriceChangeStatus,
  Text,
  TouchableOpacity,
  View
} from '@avalabs/k2-alpine'
import { TokenLogo } from 'common/components/TokenLogo'
import React, { memo, useCallback } from 'react'
import { StyleSheet } from 'react-native'
import { MarketToken } from 'store/watchlist'

const logoSize = 36

export const TrendingTokenListView = memo(
  ({
    token,
    isFavorite,
    index,
    onPress,
    onBuyPress,
    formattedPrice,
    formattedPercentChange,
    status,
    showBuyButton
  }: {
    token: MarketToken
    isFavorite?: boolean
    index: number
    formattedPrice: string
    formattedPercentChange?: string
    status: PriceChangeStatus
    onPress: () => void
    onBuyPress: () => void
    showBuyButton: boolean
  }) => {
    const renderLogo = useCallback(() => {
      if (index === 0) {
        return (
          <View>
            <TokenLogo
              size={logoSize}
              symbol={token.symbol}
              logoUri={token.logoUri}
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
        />
      )
    }, [index, token.logoUri, token.symbol])

    return (
      <TouchableOpacity onPress={onPress}>
        <View
          style={{
            paddingLeft: 16,
            paddingRight: 16,
            paddingVertical: 12,
            flexDirection: 'row'
          }}>
          {renderLogo()}
          <View
            style={{
              marginLeft: 16,
              marginRight: 16,
              flex: 1
            }}>
            <View
              sx={{
                flexDirection: 'row'
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flex: 1
                }}>
                <Text
                  variant="buttonMedium"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ maxWidth: '45%' }}>
                  {index + 1}. {token.name}
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
            </View>
            <View
              sx={{
                flexDirection: 'row',
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
                formattedPercent={formattedPercentChange}
                status={status}
              />
            </View>
          </View>
          <View style={{ justifyContent: 'center' }}>
            <Button
              type="secondary"
              size="small"
              style={styles.buyButton}
              onPress={() => {
                showBuyButton ? onBuyPress() : onPress()
              }}>
              {showBuyButton ? 'Buy' : 'View'}
            </Button>
          </View>
        </View>
      </TouchableOpacity>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.token.id === nextProps.token.id &&
      prevProps.formattedPrice === nextProps.formattedPrice &&
      prevProps.formattedPercentChange === nextProps.formattedPercentChange &&
      prevProps.isFavorite === nextProps.isFavorite &&
      prevProps.showBuyButton === nextProps.showBuyButton
    )
  }
)

const styles = StyleSheet.create({
  crownContainer: {
    position: 'absolute',
    top: '-28%',
    left: '50%',
    transform: [{ rotate: '28deg' }]
  },
  buyButton: { width: 72 }
})
