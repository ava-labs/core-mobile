import {
  Icons,
  Logos,
  Pressable,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React from 'react'
import { useDispatch } from 'react-redux'
import { setViewOnce, ViewOnceKey } from 'store/viewOnce'

export const HallidayBanner = ({
  onPress
}: {
  onPress: () => void
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const dispatch = useDispatch()

  const dismissHallidayBanner = (): void => {
    dispatch(setViewOnce(ViewOnceKey.HALLIDAY_BANNER))
  }

  return (
    <Pressable onPress={onPress}>
      <View
        sx={{
          padding: 16,
          backgroundColor: colors.$surfaceSecondary,
          borderRadius: 10,
          flexDirection: 'row',
          marginBottom: 8,
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16
        }}>
        <View
          sx={{
            borderRadius: 20,
            width: 32,
            height: 32,
            overflow: 'hidden'
          }}>
          <Logos.PartnerLogos.Halliday width={32} height={32} />
        </View>
        <View sx={{ flexShrink: 1 }}>
          <Text variant="subtitle2">Bridge using Halliday</Text>
          <Text variant="subtitle2" sx={{ color: colors.$textSecondary }}>
            Buy and bridge USD and other currencies directly to L1s using
            Halliday
          </Text>
        </View>
        <Pressable
          onPress={dismissHallidayBanner}
          sx={{ position: 'absolute', right: -6, top: -6 }}>
          <Icons.Action.Clear
            color={colors.$textPrimary}
            width={24}
            height={24}
          />
        </Pressable>
      </View>
    </Pressable>
  )
}
