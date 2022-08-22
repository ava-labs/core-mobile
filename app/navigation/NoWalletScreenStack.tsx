import { createStackNavigator } from '@react-navigation/stack'
import {
  createDrawerNavigator,
  DrawerContentComponentProps
} from '@react-navigation/drawer'
import AppNavigation from 'navigation/AppNavigation'
import React from 'react'
import NoWalletTabNavigator, {
  NoWalletTabNavigatorParamList
} from 'navigation/wallet/NoWalletTabNavigator'
import NoWalletDrawerView from 'screens/drawerNoWallet/NoWalletDrawerView'
import { MainHeaderOptions } from 'navigation/NavUtils'
import CurrencySelector from 'screens/drawer/currency-selector/CurrencySelector'
import EnterWithMnemonicStack from 'navigation/onboarding/EnterWithMnemonicStack'
import CreateWalletStack from 'navigation/onboarding/CreateWalletStack'
import TokenDetail from 'screens/watchlist/TokenDetail'
import { NavigatorScreenParams } from '@react-navigation/native'
import { DrawerParamList } from 'navigation/wallet/DrawerScreenStack'
import { SignOutBottomSheetScreen } from 'navigation/WalletScreenStack'
import LegalStackScreen, {
  LegalStackParamList
} from 'navigation/wallet/LegalStackScreen'

export type NoWalletScreenStackParams = {
  [AppNavigation.NoWallet.Drawer]: NavigatorScreenParams<DrawerParamList>
  [AppNavigation.NoWallet.Legal]: NavigatorScreenParams<LegalStackParamList>
  [AppNavigation.NoWallet.CurrencySelector]: undefined
  [AppNavigation.Wallet.TokenDetail]: undefined
  [AppNavigation.NoWallet.EnterWithMnemonicStack]: undefined
  [AppNavigation.NoWallet.CreateWalletStack]: undefined
  [AppNavigation.Modal.SignOut]: undefined
}

const NoWalletNavigator = createStackNavigator<NoWalletScreenStackParams>()
const DrawerStack = createDrawerNavigator<NoWalletDrawerParamList>()

export const NoWalletScreenStack = () => {
  return (
    <NoWalletNavigator.Navigator
      screenOptions={{
        headerShown: false
      }}>
      <NoWalletNavigator.Screen
        name={AppNavigation.NoWallet.Drawer}
        component={DrawerWatchlist}
      />
      <NoWalletNavigator.Screen
        options={{
          ...MainHeaderOptions('Currency')
        }}
        name={AppNavigation.NoWallet.CurrencySelector}
        component={CurrencySelector}
      />
      <NoWalletNavigator.Screen
        name={AppNavigation.NoWallet.Legal}
        component={LegalStackScreen}
      />
      <NoWalletNavigator.Screen
        name={AppNavigation.NoWallet.EnterWithMnemonicStack}
        component={EnterWithMnemonicStack}
      />
      <NoWalletNavigator.Screen
        name={AppNavigation.NoWallet.CreateWalletStack}
        component={CreateWalletStack}
      />
      <NoWalletNavigator.Screen
        options={{
          ...MainHeaderOptions('')
        }}
        name={AppNavigation.Wallet.TokenDetail}
        component={TokenDetail}
      />
      <NoWalletNavigator.Group
        screenOptions={{ presentation: 'transparentModal' }}>
        <NoWalletNavigator.Screen
          name={AppNavigation.Modal.SignOut}
          component={SignOutBottomSheetScreen}
        />
      </NoWalletNavigator.Group>
    </NoWalletNavigator.Navigator>
  )
}

export type NoWalletDrawerParamList = {
  [AppNavigation.NoWallet
    .Tabs]: NavigatorScreenParams<NoWalletTabNavigatorParamList>
}

// this makes linter stop complaining about not creating components at re-render
function ExtractDrawerView(props: DrawerContentComponentProps) {
  return <NoWalletDrawerView drawerProps={props} />
}

const DrawerWatchlist = () => (
  <DrawerStack.Navigator
    screenOptions={{
      headerShown: false,
      drawerStyle: { width: '80%' }
    }}
    useLegacyImplementation
    drawerContent={ExtractDrawerView}>
    <DrawerStack.Screen
      name={AppNavigation.NoWallet.Tabs}
      component={NoWalletTabNavigator}
    />
  </DrawerStack.Navigator>
)
