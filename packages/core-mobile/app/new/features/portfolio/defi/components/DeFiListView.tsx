import React from 'react'
import {
  Icons,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { DeFiChain, DeFiSimpleProtocol } from 'services/defi/types'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { useOnPressAnimation } from 'common/hooks/useOnPressAnimation'
import { LogoWithNetwork } from './LogoWithNetwork'

export const DeFiListView = ({
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
  const { animatedStyle } = useOnPressAnimation()

  const handleOnPress = (): void => {
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
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <LogoWithNetwork item={item} chain={chain} size="small" />
            <View>
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
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={onPressArrow}>
            <Icons.Custom.Outbound color={theme.colors.$textPrimary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}
