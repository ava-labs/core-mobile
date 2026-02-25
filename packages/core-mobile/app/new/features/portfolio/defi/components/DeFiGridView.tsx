import {
  AnimatedPressable,
  Icons,
  MaskedText,
  Text,
  TouchableOpacity,
  usePreventParentPress,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { GRID_GAP } from 'common/consts'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import React from 'react'
import { Dimensions, ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { DeFiChain, DeFiSimpleProtocol } from 'services/defi/types'
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
    <Animated.View entering={getListItemEnteringAnimation(index)} style={style}>
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
          <LogoWithNetwork
            item={item}
            chain={chain}
            size="large"
            testID={`defi_grid_item__${index}`}
          />
          <View sx={{ alignItems: 'center' }}>
            <Text
              variant="buttonMedium"
              numberOfLines={1}
              testID={`defi_grid_title__${index}`}>
              {item.name}
            </Text>
            <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaskedText
                testID={`defi_grid_price__${index}`}
                shouldMask={isPrivacyModeEnabled}
                sx={{ color: '$textSecondary', lineHeight: 18 }}
                numberOfLines={1}>
                {formattedPrice}
              </MaskedText>
              <TouchableOpacity
                testID={`defi_grid_browser_btn__${index}`}
                onPress={handleOnPressArrow}
                hitSlop={50}>
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
