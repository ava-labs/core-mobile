import React from 'react'
import {
  Icons,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { Dimensions } from 'react-native'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { DeFiChain, DeFiSimpleProtocol } from 'services/defi/types'
import { useOnPressAnimation } from 'common/hooks/useOnPressAnimation'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { LogoWithNetwork } from './LogoWithNetwork'

export const DeFiGridView = ({
  item,
  chain,
  index,
  formattedPrice,
  onPress,
  onPressArrow
}: {
  item: DeFiSimpleProtocol
  chain: DeFiChain | undefined
  index: number
  formattedPrice: string
  onPress: () => void
  onPressArrow: () => void
}): React.JSX.Element => {
  const { theme } = useTheme()
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
      <TouchableOpacity onPress={handleOnPress}>
        <View
          sx={{
            borderRadius: 18,
            backgroundColor: '$surfaceSecondary',
            gap: 16,
            width: (SCREEN_WIDTH - 16 * 3) / 2,
            paddingTop: 40,
            paddingBottom: 36,
            alignItems: 'center'
          }}>
          <LogoWithNetwork item={item} chain={chain} size="large" />
          <View sx={{ alignItems: 'center' }}>
            <Text variant="buttonMedium" numberOfLines={1}>
              {item.name}
            </Text>
            <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text
                variant="body2"
                sx={{ color: '$textSecondary', lineHeight: 18 }}
                numberOfLines={1}>
                {formattedPrice}
              </Text>
              <TouchableOpacity onPress={onPressArrow} hitSlop={10}>
                <Icons.Custom.Outbound color={theme.colors.$textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const SCREEN_WIDTH = Dimensions.get('window').width
