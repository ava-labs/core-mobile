import {
  Icons,
  MaskedText,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React from 'react'
import { DeFiChain, DeFiSimpleProtocol } from 'services/defi/types'
import { useSelector } from 'react-redux'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { LogoWithNetwork } from './LogoWithNetwork'
import { HORIZONTAL_MARGIN } from 'common/consts'
import { HORIZONTAL_ITEM_GAP } from 'features/portfolio/collectibles/consts'

export const DeFiListView = ({
  item,
  chain,
  formattedPrice,
  onPress,
  onPressArrow
}: {
  item: DeFiSimpleProtocol
  chain: DeFiChain | undefined
  formattedPrice: string
  onPress: () => void
  onPressArrow: () => void
}): React.JSX.Element => {
  const { theme } = useTheme()
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)

  return (
    <TouchableOpacity
      onPress={onPress}
      sx={{
        paddingLeft: HORIZONTAL_MARGIN,
        flexDirection: 'row',
        alignItems: 'center',
        gap: HORIZONTAL_ITEM_GAP
      }}>
      <LogoWithNetwork item={item} chain={chain} size="small" />
      <View
        sx={{
          flex: 1,
          height: '100%',
          borderBottomWidth: 0.5,
          borderColor: '$borderPrimary',
          alignItems: 'center',
          flexDirection: 'row',
          gap: HORIZONTAL_ITEM_GAP,
          paddingVertical: 12,
          paddingRight: HORIZONTAL_MARGIN
        }}>
        <View style={{ flex: 1 }}>
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
            <TouchableOpacity onPress={onPressArrow} hitSlop={10}>
              <Icons.Custom.Outbound color={theme.colors.$textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
        <Icons.Navigation.ChevronRightV2 color={theme.colors.$textSecondary} />
      </View>
    </TouchableOpacity>
  )
}
