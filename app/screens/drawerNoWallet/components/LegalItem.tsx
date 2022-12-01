import React from 'react'
import AvaListItem from 'components/AvaListItem'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { NoWalletScreenProps } from 'navigation/types'

type NavigationProp = NoWalletScreenProps<
  typeof AppNavigation.NoWallet.Drawer
>['navigation']

const LegalItem = () => {
  const navigation = useNavigation<NavigationProp>()
  return (
    <>
      <AvaListItem.Base
        testID="legal_item__settings_button"
        title={'Legal'}
        showNavigationArrow
        onPress={() => {
          navigation.navigate(AppNavigation.NoWallet.Legal, {
            screen: AppNavigation.Legal.Legal
          })
        }}
      />
    </>
  )
}

export default LegalItem
