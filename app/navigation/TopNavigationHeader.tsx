import React, {FC} from 'react'
import {View} from 'react-native'
import AvaButton from 'components/AvaButton'
import {DrawerActions, useNavigation} from '@react-navigation/native'
import MenuSVG from 'components/svg/MenuSVG'
import AppNavigation from 'navigation/AppNavigation'
import HeaderAccountSelector from 'components/HeaderAccountSelector'
import {StackNavigationProp} from '@react-navigation/stack'
import {RootStackParamList} from 'navigation/WalletScreenStack'
import QRCodeSVG from 'components/svg/QRCodeSVG'

const TopNavigationHeader: FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  return (
    <View
      style={{
        flexDirection: 'row',
        paddingHorizontal: 8,
        justifyContent: 'space-between'
      }}>
      <AvaButton.Icon
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
        <MenuSVG />
      </AvaButton.Icon>
      <HeaderAccountSelector
        onPressed={() =>
          navigation.navigate(AppNavigation.Modal.AccountDropDown)
        }
      />
      <AvaButton.Icon
        onPress={() => navigation.navigate(AppNavigation.Wallet.ReceiveTokens)}>
        <QRCodeSVG />
      </AvaButton.Icon>
    </View>
  )
}

export default TopNavigationHeader
