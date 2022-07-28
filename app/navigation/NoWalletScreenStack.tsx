import { createStackNavigator } from '@react-navigation/stack'
import { createDrawerNavigator } from '@react-navigation/drawer'
import AppNavigation from 'navigation/AppNavigation'
import React from 'react'
import NoWalletTabNavigator from 'navigation/wallet/NoWalletTabNavigator'
import NoWalletDrawerView from 'screens/drawerNoWallet/NoWalletDrawerView'
import { MainHeaderOptions } from 'navigation/NavUtils'
import CurrencySelector from 'screens/drawer/currency-selector/CurrencySelector'
import EnterWithMnemonicStack from 'navigation/onboarding/EnterWithMnemonicStack'
import CreateWalletStack from 'navigation/onboarding/CreateWalletStack'
import TokenDetail from 'screens/watchlist/TokenDetail'

const NoWalletNavigator = createStackNavigator()
const DrawerStack = createDrawerNavigator()

export const NoWalletScreenStack = () => {
  return (
    <NoWalletNavigator.Navigator
      screenOptions={{
        headerShown: false
      }}>
      <NoWalletNavigator.Screen
        name={AppNavigation.Wallet.Drawer}
        component={WatchlistOnly}
      />
      <NoWalletNavigator.Screen
        options={{
          ...MainHeaderOptions('Currency')
        }}
        name={AppNavigation.Wallet.CurrencySelector}
        component={CurrencySelector}
      />
      <NoWalletNavigator.Screen
        name={AppNavigation.Onboard.EnterWithMnemonicStack}
        component={EnterWithMnemonicStack}
      />
      <NoWalletNavigator.Screen
        name={AppNavigation.Onboard.CreateWalletStack}
        component={CreateWalletStack}
      />
      <NoWalletNavigator.Screen
        options={{
          ...MainHeaderOptions('')
        }}
        name={AppNavigation.Wallet.TokenDetail}
        component={TokenDetail}
      />
    </NoWalletNavigator.Navigator>
  )
}

const WatchlistOnly = () => (
  <DrawerStack.Navigator
    screenOptions={{
      headerShown: false,
      drawerStyle: { width: '80%' }
    }}
    useLegacyImplementation
    drawerContent={() => <NoWalletDrawerView />}>
    <DrawerStack.Screen
      name={'NoWalletWatchlist'}
      component={NoWalletTabNavigator}
    />
  </DrawerStack.Navigator>
)
