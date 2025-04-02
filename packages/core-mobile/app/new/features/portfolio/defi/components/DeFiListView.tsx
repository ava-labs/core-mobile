import React from 'react'
import {
  Icons,
  SPRING_LINEAR_TRANSITION,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import Animated from 'react-native-reanimated'
import { DeFiChain, DeFiSimpleProtocol } from 'services/defi/types'
import { getListItemEnteringAnimation } from 'common/utils/animations'
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

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(index)}
      layout={SPRING_LINEAR_TRANSITION}>
      <TouchableOpacity
        onPress={onPress}
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
              <TouchableOpacity onPress={onPressArrow} hitSlop={10}>
                <Icons.Custom.Outbound color={theme.colors.$textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Icons.Navigation.ChevronRightV2 color={theme.colors.$textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  )
}
