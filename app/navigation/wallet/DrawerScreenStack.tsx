import DrawerView from 'screens/drawer/DrawerView'
import AppNavigation from 'navigation/AppNavigation'
import TabNavigator from 'navigation/wallet/TabNavigator'
import React from 'react'
import {createDrawerNavigator} from '@react-navigation/drawer'
import TopNavigationHeader from 'navigation/TopNavigationHeader'

const DrawerStack = createDrawerNavigator()

const DrawerScreenStack = () => (
  <DrawerStack.Navigator
    screenOptions={{
      headerShown: false,
      drawerStyle: {width: '80%'}
    }}
    useLegacyImplementation
    drawerContent={props => <DrawerView {...props} />}>
    <DrawerStack.Screen
      name={AppNavigation.Wallet.Tabs}
      options={{
        headerShown: true,
        header: () => <TopNavigationHeader />
      }}
      component={TabNavigator}
    />
  </DrawerStack.Navigator>
)

export default React.memo(DrawerScreenStack)
