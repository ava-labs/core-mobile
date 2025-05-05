import {
  Icons,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React from 'react'
import { DeFiChain, DeFiSimpleProtocol } from 'services/defi/types'
import { LogoWithNetwork } from './LogoWithNetwork'

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

  return (
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
  )
}
