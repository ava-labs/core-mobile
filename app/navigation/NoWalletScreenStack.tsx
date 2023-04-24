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
import TokenDetail from 'screens/watchlist/TokenDetails/TokenDetail'
import { NavigatorScreenParams } from '@react-navigation/native'
import { DrawerParamList } from 'navigation/wallet/DrawerScreenStack'
import { SignOutModalScreen } from 'navigation/WalletScreenStack/WalletScreenStack'
import LegalStackScreen, {
  LegalStackParamList
} from 'navigation/wallet/LegalStackScreen'
import WelcomeScreenStack, {
  WelcomeScreenStackParamList
} from 'navigation/onboarding/WelcomeScreenStack'

export type NoWalletScreenStackParams = {
  [AppNavigation.NoWallet.Drawer]: NavigatorScreenParams<DrawerParamList>
  [AppNavigation.NoWallet.Legal]: NavigatorScreenParams<LegalStackParamList>
  [AppNavigation.NoWallet.CurrencySelector]: undefined
  [AppNavigation.Wallet.TokenDetail]: undefined
  [AppNavigation.NoWallet
    .Welcome]: NavigatorScreenParams<WelcomeScreenStackParamList>
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
          ...MainHeaderOptions({ title: 'Currency' })
        }}
        name={AppNavigation.NoWallet.CurrencySelector}
        component={CurrencySelector}
      />
      <NoWalletNavigator.Screen
        name={AppNavigation.NoWallet.Legal}
        component={LegalStackScreen}
      />
      <NoWalletNavigator.Screen
        name={AppNavigation.NoWallet.Welcome}
        component={WelcomeScreenStack}
      />
      <NoWalletNavigator.Screen
        options={{
          ...MainHeaderOptions()
        }}
        name={AppNavigation.Wallet.TokenDetail}
        component={TokenDetail}
      />
      <NoWalletNavigator.Screen
        options={{ presentation: 'transparentModal' }}
        name={AppNavigation.Modal.SignOut}
        component={SignOutModalScreen}
      />
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
    drawerContent={ExtractDrawerView}>
    <DrawerStack.Screen
      name={AppNavigation.NoWallet.Tabs}
      component={NoWalletTabNavigator}
    />
  </DrawerStack.Navigator>
)
