import React from 'react'
import AvaListItem from 'components/AvaListItem'
import AvaText from 'components/AvaText'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { WalletScreenProps } from 'navigation/types'
import { usePostCapture } from 'hooks/usePosthogCapture'
import MoneySVG from 'components/svg/MoneySVG'
import { View } from 'react-native'

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.Drawer
>['navigation']

const CurrencyItem = () => {
  const { selectedCurrency } = useApplicationContext().appHook
  const { capture } = usePostCapture()
  const navigation = useNavigation<NavigationProp>()
  const currency = () => (
    <AvaText.Body2 textStyle={{ paddingRight: 12 }}>
      {selectedCurrency}
    </AvaText.Body2>
  )

  const icon = () => {
    return (
      <View style={{ marginRight: -8 }}>
        <MoneySVG />
      </View>
    )
  }

  return (
    <>
      <AvaListItem.Base
        title={'Currency'}
        titleAlignment={'flex-start'}
        rightComponent={currency()}
        rightComponentVerticalAlignment={'center'}
        leftComponent={icon()}
        showNavigationArrow
        onPress={() => {
          capture('CurrencySettingClicked')
          navigation.navigate(AppNavigation.Wallet.CurrencySelector)
        }}
      />
    </>
  )
}

export default CurrencyItem
