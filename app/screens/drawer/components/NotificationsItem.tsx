import React from 'react'
import AvaListItem from 'components/AvaListItem'
import CarrotSVG from 'components/svg/CarrotSVG'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.Drawer
>['navigation']

export default function NotificationsItem() {
  const navigation = useNavigation<NavigationProp>()

  return (
    <AvaListItem.Base
      testID="notifications_item__settings_button"
      title={'Notifications'}
      leftComponent={null}
      rightComponent={<CarrotSVG />}
      onPress={() => {
        navigation.navigate(AppNavigation.Wallet.Notifications, {
          screen: AppNavigation.Notifications.Notifications
        })
      }}
    />
  )
}
