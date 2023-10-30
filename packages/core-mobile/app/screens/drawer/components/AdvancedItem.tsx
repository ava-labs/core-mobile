import React from 'react'
import AvaListItem from 'components/AvaListItem'
import CarrotSVG from 'components/svg/CarrotSVG'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import SettingsCogSVG from 'components/svg/SettingsCogSVG'
import { View } from 'react-native'

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.Drawer
>['navigation']

export default function AdvancedItem() {
  const navigation = useNavigation<NavigationProp>()

  const icon = () => {
    return (
      <View style={{ marginRight: -8 }}>
        <SettingsCogSVG />
      </View>
    )
  }

  return (
    <>
      <AvaListItem.Base
        testID="advanced_item__settings_button"
        title={'Advanced'}
        rightComponent={<CarrotSVG />}
        leftComponent={icon()}
        onPress={() => {
          navigation.navigate(AppNavigation.Wallet.Advanced, {
            screen: AppNavigation.Advanced.Advanced
          })
        }}
      />
    </>
  )
}
