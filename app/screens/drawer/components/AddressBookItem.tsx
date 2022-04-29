import React from 'react'
import AvaListItem from 'components/AvaListItem'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { WalletScreenProps } from 'navigation/types'

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.Drawer
>['navigation']

const AddressBookItem = () => {
  const navigation = useNavigation<NavigationProp>()

  return (
    <>
      <AvaListItem.Base
        title={'Address Book'}
        titleAlignment={'flex-start'}
        showNavigationArrow
        rightComponentVerticalAlignment={'center'}
        onPress={() => {
          navigation.navigate(AppNavigation.Wallet.AddressBook)
        }}
      />
    </>
  )
}

export default AddressBookItem
