import { NavigatorScreenParams } from '@react-navigation/native'
import DrawerView from 'screens/drawer/DrawerView'
import AppNavigation from 'navigation/AppNavigation'
import TabNavigator, {
  TabNavigatorParamList
} from 'navigation/wallet/TabNavigator'
import React from 'react'
import { createDrawerNavigator } from '@react-navigation/drawer'
import TopNavigationHeader from 'navigation/TopNavigationHeader'

export type DrawerParamList = {
  [AppNavigation.Wallet.Tabs]: NavigatorScreenParams<TabNavigatorParamList>
}

const DrawerStack = createDrawerNavigator()

const DrawerScreenStack = () => (
  <DrawerStack.Navigator
    screenOptions={{
      headerShown: false,
      drawerStyle: { width: '80%' }
    }}
    useLegacyImplementation
    drawerContent={() => <DrawerView />}>
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
