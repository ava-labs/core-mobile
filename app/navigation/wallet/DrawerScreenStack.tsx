import DrawerView from 'screens/drawer/DrawerView';
import AppNavigation from 'navigation/AppNavigation';
import TabNavigator from 'navigation/wallet/TabNavigator';
import React from 'react';
import {createDrawerNavigator} from '@react-navigation/drawer';

const DrawerStack = createDrawerNavigator();

const DrawerScreenStack = () => (
  <DrawerStack.Navigator
    screenOptions={{headerShown: false, drawerStyle: {width: '80%'}}}
    useLegacyImplementation
    drawerContent={() => <DrawerView />}>
    <DrawerStack.Screen
      name={AppNavigation.Wallet.Tabs}
      options={{headerShown: false}}
      component={TabNavigator}
    />
  </DrawerStack.Navigator>
);

export default React.memo(DrawerScreenStack);
