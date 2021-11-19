import DrawerView from 'screens/drawer/DrawerView';
import AppNavigation from 'navigation/AppNavigation';
import TabNavigator from 'navigation/TabNavigator';
import React from 'react';
import {createDrawerNavigator} from '@react-navigation/drawer';

export type DrawerStackParamList = {
  Tabs: undefined;
  CurrencySelector:
    | undefined
    | {onCurrencySelected: (code: string) => void; selectedCurrency: string};
  Legal: undefined;
  Security: undefined;
};

const DrawerStack = createDrawerNavigator<DrawerStackParamList>();

const DrawerNavigator = () => (
  <DrawerStack.Navigator
    screenOptions={{headerShown: false, drawerStyle: {width: '80%'}}}
    useLegacyImplementation
    drawerContent={props => <DrawerView {...props} />}>
    <DrawerStack.Screen
      name={AppNavigation.Tabs.Tabs}
      options={{headerShown: false}}
      component={TabNavigator}
    />
  </DrawerStack.Navigator>
);

export default React.memo(DrawerNavigator);
