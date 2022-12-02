import React from 'react'
import AvaListItem from 'components/AvaListItem'
import AvaText from 'components/AvaText'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { NoWalletScreenProps } from 'navigation/types'

type NavigationProp = NoWalletScreenProps<
  typeof AppNavigation.NoWallet.Drawer
>['navigation']

const CurrencyItem = () => {
  const { selectedCurrency } = useApplicationContext().appHook
  const navigation = useNavigation<NavigationProp>()
  const currency = () => (
    <AvaText.Body2 textStyle={{ paddingRight: 12 }}>
      {selectedCurrency}
    </AvaText.Body2>
  )

  return (
    <>
      <AvaListItem.Base
        testID="currency_item__settings_button"
        title={'Currency'}
        titleAlignment={'flex-start'}
        rightComponent={currency()}
        rightComponentVerticalAlignment={'center'}
        showNavigationArrow
        onPress={() => {
          navigation.navigate(AppNavigation.NoWallet.CurrencySelector)
        }}
      />
    </>
  )
}

export default CurrencyItem
