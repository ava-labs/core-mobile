import { NavigatorScreenParams } from '@react-navigation/native'
import DrawerView from 'screens/drawer/DrawerView'
import AppNavigation from 'navigation/AppNavigation'
import TabNavigator, {
  TabNavigatorParamList
} from 'navigation/wallet/TabNavigator'
import React, { FC } from 'react'
import { createDrawerNavigator } from '@react-navigation/drawer'

export type DrawerParamList = {
  [AppNavigation.Wallet.Tabs]: NavigatorScreenParams<TabNavigatorParamList>
}

const DrawerStack = createDrawerNavigator()

const DrawerContent = (): JSX.Element => <DrawerView />

const DrawerScreenStack: FC = () => (
  <DrawerStack.Navigator
    screenOptions={{
      headerShown: false,
      drawerStyle: { width: '80%' }
    }}
    drawerContent={DrawerContent}>
    <DrawerStack.Screen
      name={AppNavigation.Wallet.Tabs}
      component={TabNavigator}
    />
  </DrawerStack.Navigator>
)

export default React.memo(DrawerScreenStack)
