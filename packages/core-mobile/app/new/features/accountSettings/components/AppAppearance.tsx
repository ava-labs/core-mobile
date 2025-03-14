import React from 'react'
import {
  TouchableOpacity,
  useTheme,
  Text,
  Icons,
  View,
  Separator
} from '@avalabs/k2-alpine'
import { Dimensions } from 'react-native'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'

const SCREEN_WIDTH = Dimensions.get('window').width

export const AppAppearance = ({
  selectAppAppearance,
  selectAppIcon,
  selectCurrency
}: {
  selectCurrency: () => void
  selectAppAppearance: () => void
  selectAppIcon: () => void
}): React.JSX.Element => {
  const {
    theme: { colors, isDark }
  } = useTheme()
  const currency = useSelector(selectSelectedCurrency)

  return (
    <View
      sx={{
        backgroundColor: colors.$surfaceSecondary,
        borderRadius: 12,
        width: SCREEN_WIDTH - 32
      }}>
      {/* Currency */}
      <TouchableOpacity
        sx={{
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 13,
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
        onPress={selectCurrency}>
        <Text
          variant="body2"
          sx={{ color: colors.$textPrimary, fontSize: 16, lineHeight: 22 }}>
          Currency
        </Text>
        <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            sx={{
              width: 21,
              height: 21,
              borderRadius: 21,
              overflow: 'hidden'
            }}>
            <Icons.Currencies.USD width={21} height={21} />
          </View>
          <Text
            variant="body2"
            sx={{
              color: colors.$textSecondary,
              fontSize: 16,
              lineHeight: 22,
              marginLeft: 9,
              marginRight: 16
            }}>
            {currency.toUpperCase()}
          </Text>
          <Icons.Navigation.ChevronRightV2 />
        </View>
      </TouchableOpacity>
      <Separator sx={{ marginHorizontal: 16 }} />

      {/* App Appearance */}
      <TouchableOpacity
        sx={{
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 13,
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
        onPress={selectAppAppearance}>
        <Text
          variant="body2"
          sx={{ color: colors.$textPrimary, fontSize: 16, lineHeight: 22 }}>
          Appearance
        </Text>
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Text
            variant="body2"
            sx={{ color: colors.$textSecondary, fontSize: 16, lineHeight: 22 }}>
            {isDark ? 'Dark theme' : 'Light theme'}
          </Text>
          <Icons.Navigation.ChevronRightV2 />
        </View>
      </TouchableOpacity>
      <Separator sx={{ marginHorizontal: 16 }} />

      {/* App Icon */}
      <TouchableOpacity
        sx={{
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 13,
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
        onPress={selectAppIcon}>
        <Text
          variant="body2"
          sx={{ color: colors.$textPrimary, fontSize: 16, lineHeight: 22 }}>
          App icon
        </Text>
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Text
            variant="body2"
            sx={{ color: colors.$textSecondary, fontSize: 16, lineHeight: 22 }}>
            Default
          </Text>
          <Icons.Navigation.ChevronRightV2 />
        </View>
      </TouchableOpacity>
    </View>
  )
}
