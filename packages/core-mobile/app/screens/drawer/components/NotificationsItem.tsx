import React from 'react'
import AvaListItem from 'components/AvaListItem'
import CarrotSVG from 'components/svg/CarrotSVG'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import NotificationsNoneSVG from 'components/svg/NotificationsNoneSVG'
import { View } from 'react-native'

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.Drawer
>['navigation']

export default function NotificationsItem() {
  const navigation = useNavigation<NavigationProp>()

  const icon = () => {
    return (
      <View style={{ marginRight: -8 }}>
        <NotificationsNoneSVG />
      </View>
    )
  }

  return (
    <AvaListItem.Base
      testID="notifications_item__settings_button"
      title={'Notifications'}
      leftComponent={icon()}
      rightComponent={<CarrotSVG />}
      onPress={() => {
        navigation.navigate(AppNavigation.Wallet.Notifications, {
          screen: AppNavigation.Notifications.Notifications
        })
      }}
    />
  )
}
