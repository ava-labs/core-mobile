import React from 'react'
import AvaListItem from 'components/AvaListItem'
import CarrotSVG from 'components/svg/CarrotSVG'
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
      titleAlignment={'flex-start'}
      leftComponent={null}
      rightComponent={<CarrotSVG />}
      rightComponentVerticalAlignment={'center'}
      onPress={() => {
        navigation.navigate(AppNavigation.Wallet.SecurityPrivacy)
      }}
    />
  )
}

export default SecurityItem
