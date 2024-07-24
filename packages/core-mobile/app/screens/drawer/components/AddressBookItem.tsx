import React from 'react'
import AvaListItem from 'components/AvaListItem'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { WalletScreenProps } from 'navigation/types'
import AddressBookSVG from 'components/svg/AddressBookSVG'
import { View } from 'react-native'
import AnalyticsService from 'services/analytics/AnalyticsService'

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.Drawer
>['navigation']

const AddressBookItem = (): JSX.Element => {
  const navigation = useNavigation<NavigationProp>()

  const icon = (): JSX.Element => {
    return (
      <View style={{ marginRight: -8 }}>
        <AddressBookSVG />
      </View>
    )
  }

  return (
    <>
      <AvaListItem.Base
        testID="address_book_item__settings_button"
        title={'Address Book'}
        titleAlignment={'flex-start'}
        showNavigationArrow
        rightComponentVerticalAlignment={'center'}
        leftComponent={icon()}
        onPress={() => {
          AnalyticsService.capture('AddContactClicked')
          navigation.navigate(AppNavigation.Wallet.AddressBook)
        }}
      />
    </>
  )
}

export default AddressBookItem
