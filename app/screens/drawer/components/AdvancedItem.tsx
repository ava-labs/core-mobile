import React from 'react'
import AvaListItem from 'components/AvaListItem'
import CarrotSVG from 'components/svg/CarrotSVG'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.Drawer
>['navigation']

export default function AdvancedItem() {
  const navigation = useNavigation<NavigationProp>()

  return (
    <>
      <AvaListItem.Base
        title={'Advanced'}
        leftComponent={null}
        rightComponent={<CarrotSVG />}
        onPress={() => {
          navigation.navigate(AppNavigation.Wallet.Advanced)
        }}
      />
    </>
  )
}
