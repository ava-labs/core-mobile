import React from 'react'
import AvaListItem from 'components/AvaListItem'
import AvaText from 'components/AvaText'
import AppNavigation from 'navigation/AppNavigation'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigatorProps} from 'react-native-screens/lib/typescript/native-stack/types'
import {useApplicationContext} from 'contexts/ApplicationContext'

const CurrencyItem = () => {
  const {selectedCurrency} = useApplicationContext().appHook
  const navigation = useNavigation<NativeStackNavigatorProps>()
  const currency = () => (
    <AvaText.Body2 textStyle={{paddingRight: 12}}>
      {selectedCurrency}
    </AvaText.Body2>
  )

  return (
    <>
      <AvaListItem.Base
        title={'Currency'}
        titleAlignment={'flex-start'}
        rightComponent={currency()}
        rightComponentVerticalAlignment={'center'}
        showNavigationArrow
        onPress={() => {
          navigation?.navigate(AppNavigation.Wallet.CurrencySelector, {
            currency: selectedCurrency
          })
        }}
      />
    </>
  )
}

export default CurrencyItem
