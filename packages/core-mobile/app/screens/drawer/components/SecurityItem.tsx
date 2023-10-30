import React from 'react'
import AvaListItem from 'components/AvaListItem'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { WalletScreenProps } from 'navigation/types'
import LockSVG from 'components/svg/LockSVG'
import { View } from 'react-native'

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.Drawer
>['navigation']

const SecurityItem = () => {
  const navigation = useNavigation<NavigationProp>()

  const icon = () => {
    return (
      <View style={{ marginRight: -8 }}>
        <LockSVG />
      </View>
    )
  }

  return (
    <AvaListItem.Base
      title={'Security & Privacy'}
      showNavigationArrow
      leftComponent={icon()}
      onPress={() => {
        navigation.navigate(AppNavigation.Wallet.SecurityPrivacy)
      }}
    />
  )
}

export default SecurityItem
