import { Icons, Pressable, Text, useTheme, View } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { BridgeScreenProps } from 'navigation/types'
import React from 'react'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { setViewOnce, ViewOnceKey } from 'store/viewOnce'

type NavigationProps = BridgeScreenProps<typeof AppNavigation.Bridge.Bridge>

export const HallidayBanner = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const dispatch = useDispatch()
  const { navigate } = useNavigation<NavigationProps['navigation']>()

  const openHalliday = async (): Promise<void> => {
    AnalyticsService.capture('HallidayBuyClicked')
    navigate(AppNavigation.Wallet.Halliday)
  }

  const dismissHallidayBanner = (): void => {
    dispatch(setViewOnce(ViewOnceKey.HALLIDAY_BANNER))
  }

  return (
    <Pressable
      style={{
        padding: 16,
        backgroundColor: colors.$neutral900,
        borderRadius: 10
      }}
      onPress={openHalliday}>
      <View
        sx={{
          flexDirection: 'row',
          marginBottom: 8,
          justifyContent: 'space-between'
        }}>
        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8
          }}>
          <View
            sx={{
              borderRadius: 20,
              width: 40,
              height: 40,
              overflow: 'hidden'
            }}>
            <Icons.Logos.Halliday width={40} height={40} />
          </View>
          <Text variant="heading6">Bridge using Halliday</Text>
        </View>
        <Pressable onPress={dismissHallidayBanner}>
          <Icons.Navigation.Cancel color={colors.$neutral700} />
        </Pressable>
      </View>
      <Text variant="caption">
        Buy and bridge USD and other currencies directly to L1s using Halliday.
      </Text>
    </Pressable>
  )
}
