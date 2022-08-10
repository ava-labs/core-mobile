import React from 'react'
import AvaListItem from 'components/AvaListItem'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { WalletScreenProps } from 'navigation/types'

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.Drawer
>['navigation']

const SecurityItem = () => {
  const navigation = useNavigation<NavigationProp>()

  return (
    <AvaListItem.Base
      title={'Security & Privacy'}
      showNavigationArrow
      onPress={() => {
        navigation.navigate(AppNavigation.Wallet.SecurityPrivacy)
      }}
    />
  )
}

export default SecurityItem
