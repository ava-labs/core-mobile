import React from 'react';
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin';
import HdWalletLogin from 'screens/login/HdWalletLogin';
import {createStackNavigator} from '@react-navigation/stack';
import {CreateWalletStackScreen} from './CreateWalletStackScreen';
import Onboard from 'screens/onboarding/Onboard';
import AvaNavigation from 'navigation/AvaNavigation';

const AuthStack = createStackNavigator();

export const AuthStackScreen = () => {
  return (
    <AuthStack.Navigator screenOptions={{headerShown: false}}>
      <AuthStack.Screen name={AvaNavigation.Auth.Onboard} component={Onboard} />
      <AuthStack.Screen
        name={AvaNavigation.Auth.Login}
        component={PinOrBiometryLogin}
      />
      <AuthStack.Screen
        name={AvaNavigation.Auth.LoginWithMnemonic}
        component={HdWalletLogin}
      />
      <AuthStack.Screen
        name={AvaNavigation.Auth.CreateWalletFlow}
        component={CreateWalletStackScreen}
      />
    </AuthStack.Navigator>
  );
};
