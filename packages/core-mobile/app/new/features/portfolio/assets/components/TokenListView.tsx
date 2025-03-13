import React from 'react'
import {
  AnimatedPressable,
  Icons,
  PriceChangeIndicator,
  SPRING_LINEAR_TRANSITION,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import Animated from 'react-native-reanimated'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { TokenListViewProps } from '../types'
import { LogoWithNetwork } from './LogoWithNetwork'

export const TokenListView = ({
  token,
  index,
  onPress,
  formattedBalance,
  formattedPrice,
  priceChangeStatus
}: TokenListViewProps): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(index)}
      layout={SPRING_LINEAR_TRANSITION}>
      <AnimatedPressable onPress={onPress}>
        <View
          sx={{
            borderRadius: 18,
            paddingLeft: 16,
            paddingRight: 12,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '$surfaceSecondary'
          }}>
          <LogoWithNetwork token={token} />
          <View
            sx={{
              flexGrow: 1,
              flexShrink: 1,
              marginHorizontal: 12
            }}>
            <View
              sx={{
                flexShrink: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 24
              }}>
              <Text variant="buttonMedium" numberOfLines={1} sx={{ flex: 1 }}>
                {token.name}
              </Text>
              <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {!token.isDataAccurate && (
                  <Icons.Alert.Error
                    width={16}
                    height={16}
                    color={colors.$textDanger}
                  />
                )}
                <Text
                  variant="buttonMedium"
                  numberOfLines={1}
                  sx={{ lineHeight: 18, marginBottom: 1 }}>
                  {formattedBalance}
                </Text>
              </View>
            </View>
            <View
              sx={{
                flexDirection: 'row',
                flexShrink: 1,
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 24
              }}>
              <Text
                variant="body2"
                sx={{ lineHeight: 16, flex: 1 }}
                ellipsizeMode="tail"
                numberOfLines={1}>
                {token.balanceDisplayValue} {token.symbol}
              </Text>
              <PriceChangeIndicator
                formattedPrice={formattedPrice}
                status={priceChangeStatus}
              />
            </View>
          </View>
          <View
            sx={{
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            <Icons.Navigation.ChevronRightV2 color={colors.$textSecondary} />
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  )
}
