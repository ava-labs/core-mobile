import React from 'react'
import {
  Icons,
  MaskedText,
  SPRING_LINEAR_TRANSITION,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { Dimensions } from 'react-native'
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
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(index)}
      layout={SPRING_LINEAR_TRANSITION}>
      <TouchableOpacity onPress={onPress}>
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
              <View onTouchStart={e => e.stopPropagation()} hitSlop={50}>
                <TouchableOpacity onPress={onPressArrow} hitSlop={50}>
                  <Icons.Custom.Outbound color={theme.colors.$textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const SCREEN_WIDTH = Dimensions.get('window').width
