import React from 'react'
import {
  AnimatedPressable,
  Icons,
  PriceChangeIndicator,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { Dimensions } from 'react-native'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { TokenListViewProps } from '../types'
import { LogoWithNetwork } from './LogoWithNetwork'

const SCREEN_WIDTH = Dimensions.get('window').width

export const TokenGridView = ({
  token,
  index,
  onPress,
  priceChangeStatus,
  formattedBalance,
  formattedPrice
}: TokenListViewProps): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(index)}
      layout={LinearTransition.springify()}>
      <AnimatedPressable onPress={onPress}>
        <View
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
                {token.balanceDisplayValue} {token.symbol}
              </Text>
            </View>
          </View>
          <View sx={{ marginTop: 19 }}>
            <View>
              <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
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
              <PriceChangeIndicator
                formattedPrice={formattedPrice}
                status={priceChangeStatus}
              />
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  )
}
