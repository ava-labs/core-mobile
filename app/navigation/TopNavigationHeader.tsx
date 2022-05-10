import React, { FC } from 'react'
import { View } from 'react-native'
import AvaButton from 'components/AvaButton'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import MenuSVG from 'components/svg/MenuSVG'
import AppNavigation from 'navigation/AppNavigation'
import HeaderAccountSelector from 'components/HeaderAccountSelector'
import { DrawerScreenProps } from 'navigation/types'
import NetworkDropdown from 'screens/network/NetworkDropdown'

type NavigationProp = DrawerScreenProps<
  typeof AppNavigation.Wallet.Tabs
>['navigation']

const TopNavigationHeader: FC = () => {
  const navigation = useNavigation<NavigationProp>()

  return (
    <View
      style={{
        flexDirection: 'row',
        paddingLeft: 8,
        paddingRight: 16,
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
      <AvaButton.Icon
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
        <MenuSVG />
      </AvaButton.Icon>
      <View style={{ zIndex: 1 }}>
        <HeaderAccountSelector
          onPressed={() =>
            navigation.navigate(AppNavigation.Modal.AccountDropDown)
          }
        />
      </View>
      <NetworkDropdown />
    </View>
  )
}

export default TopNavigationHeader
