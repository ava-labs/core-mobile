import React from 'react'
import {
  AnimatedPressable,
  Icons,
  MaskedText,
  SPRING_LINEAR_TRANSITION,
  Text,
  TouchableOpacity,
  usePreventParentPress,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { Dimensions, ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { DeFiChain, DeFiSimpleProtocol } from 'services/defi/types'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { GRID_GAP } from 'common/consts'
import { useSelector } from 'react-redux'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { LogoWithNetwork } from './LogoWithNetwork'

export const DeFiGridView = ({
  item,
  chain,
  index,
  formattedPrice,
  onPress,
  onPressArrow,
  style
}: {
  item: DeFiSimpleProtocol
  chain: DeFiChain | undefined
  index: number
  formattedPrice: string
  onPress: () => void
  onPressArrow: () => void
  style: ViewStyle
}): React.JSX.Element => {
  const { theme } = useTheme()
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const { createParentPressHandler, createChildPressHandler } =
    usePreventParentPress()

  const handleOnPress = createParentPressHandler(() => {
    onPress()
  })

  const handleOnPressArrow = createChildPressHandler(() => {
    onPressArrow()
  })

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(index)}
      layout={SPRING_LINEAR_TRANSITION}
      style={style}>
      <AnimatedPressable onPress={handleOnPress}>
        <View
          sx={{
            borderRadius: 18,
            backgroundColor: '$surfaceSecondary',
            gap: 16,
            width: (SCREEN_WIDTH - 16 * 2 - GRID_GAP) / 2,
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
              <MaskedText
                shouldMask={isPrivacyModeEnabled}
                sx={{ color: '$textSecondary', lineHeight: 18 }}
                numberOfLines={1}>
                {formattedPrice}
              </MaskedText>
              <TouchableOpacity onPress={handleOnPressArrow} hitSlop={50}>
                <Icons.Custom.Outbound color={theme.colors.$textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  )
}

const SCREEN_WIDTH = Dimensions.get('window').width
