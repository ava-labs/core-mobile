import {
  Icons,
  MaskedText,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { HORIZONTAL_MARGIN } from 'common/consts'
import { HORIZONTAL_ITEM_GAP } from 'features/portfolio/collectibles/consts'
import React from 'react'
import { useSelector } from 'react-redux'
import { DeFiChain, DeFiSimpleProtocol } from 'services/defi/types'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { LogoWithNetwork } from './LogoWithNetwork'

export const DeFiListView = ({
  item,
  chain,
  formattedPrice,
  index,
  onPress,
  onPressArrow
}: {
  item: DeFiSimpleProtocol
  chain: DeFiChain | undefined
  formattedPrice: string
  index: number
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
      <LogoWithNetwork
        item={item}
        chain={chain}
        size="small"
        testID={`defi_list_item__${index}`}
      />
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
          <Text
            variant="buttonMedium"
            numberOfLines={1}
            testID={`defi_list_title__${index}`}>
            {item.name}
          </Text>
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaskedText
              testID={`defi_list_price__${index}`}
              shouldMask={isPrivacyModeEnabled}
              sx={{ color: '$textSecondary', lineHeight: 18 }}
              numberOfLines={1}>
              {formattedPrice}
            </MaskedText>
            <TouchableOpacity
              testID={`defi_list_browser_btn__${index}`}
              onPress={onPressArrow}
              hitSlop={10}>
              <Icons.Custom.Outbound color={theme.colors.$textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
        <Icons.Navigation.ChevronRightV2 color={theme.colors.$textSecondary} />
      </View>
    </TouchableOpacity>
  )
}
