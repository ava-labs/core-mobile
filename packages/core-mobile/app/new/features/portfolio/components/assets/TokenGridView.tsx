import React from 'react'
import {
  Icons,
  PriceChangeIndicator,
  Text,
  TouchableOpacity,
  View
} from '@avalabs/k2-alpine'
import { Space } from 'components/Space'
import { Dimensions } from 'react-native'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { LogoWithNetwork } from './LogoWithNetwork'
import { TokenListViewProps } from './types'
import { getListItemEnteringAnimation } from './consts'
import { useOnPressAnimation } from './useOnPressAnimation'

const SCREEN_WIDTH = Dimensions.get('window').width

export const TokenGridView = ({
  token,
  index,
  onPress,
  status,
  priceChange,
  formattedBalance,
  formattedPrice
}: TokenListViewProps): React.JSX.Element => {
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
          padding: 16,
          backgroundColor: '$surfaceSecondary',
          gap: 8,
          width: (SCREEN_WIDTH - 16 * 3) / 2
        }}>
        <LogoWithNetwork token={token} />
        <View>
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
        <View sx={{ marginTop: 19 }}>
          <View>
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
            {priceChange ? (
              <PriceChangeIndicator
                formattedPrice={formattedPrice}
                status={status}
              />
            ) : (
              <View sx={{ height: 14 }} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}
