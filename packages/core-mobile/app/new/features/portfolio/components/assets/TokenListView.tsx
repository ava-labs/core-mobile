import React from 'react'
import {
  Icons,
  PriceChangeIndicator,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { Space } from 'components/Space'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { LogoWithNetwork } from './LogoWithNetwork'
import { TokenListViewProps } from './types'
import { getListItemEnteringAnimation } from './consts'
import { useOnPressAnimation } from './useOnPressAnimation'

export const TokenListView = ({
  token,
  index,
  onPress,
  formattedBalance,
  priceChange,
  formattedPrice,
  status
}: TokenListViewProps): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { handleOnPressAnimation, animatedStyle } = useOnPressAnimation()

  const handleOnPress = (): void => {
    handleOnPressAnimation()
    onPress()
  }

  return (
    <Animated.View
      style={animatedStyle}
      entering={getListItemEnteringAnimation(index)}
      layout={LinearTransition.springify()}>
      <TouchableOpacity
        onPress={handleOnPress}
        sx={{
          borderRadius: 18,
          paddingHorizontal: 17,
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
            flexDirection: 'row',
            justifyContent: 'space-between'
          }}>
          <View
            sx={{
              marginLeft: 8,
              marginRight: 16,
              flex: 2
            }}>
            <Text
              variant="buttonMedium"
              numberOfLines={1}
              sx={{ lineHeight: 16 }}>
              {token.name}
            </Text>
            <View sx={{ flexDirection: 'row', flexShrink: 1 }}>
              <Text
                variant="body2"
                sx={{ lineHeight: 16 }}
                ellipsizeMode="tail"
                numberOfLines={1}>
                {token.balanceDisplayValue}
              </Text>
              <Space x={4} />
              <Text
                variant="body2"
                numberOfLines={1}
                ellipsizeMode="tail"
                sx={{ flex: 1 }}>
                {token.symbol}
              </Text>
            </View>
          </View>
          <View
            sx={{
              alignItems: 'flex-end',
              flexShrink: 1,
              justifyContent: 'center',
              flex: 1
            }}>
            <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              {!token.isDataAccurate && (
                <Icons.Alert.Error width={16} height={16} color={'#E84142'} />
              )}
              <Text
                variant="buttonMedium"
                numberOfLines={1}
                sx={{ fontWeight: '500', lineHeight: 16 }}>
                {formattedBalance}
              </Text>
            </View>
            {priceChange && (
              <PriceChangeIndicator
                formattedPrice={formattedPrice}
                status={status}
              />
            )}
          </View>
        </View>
        <View
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 13
          }}>
          <Icons.Navigation.ChevronRightV2 color={colors.$textSecondary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}
