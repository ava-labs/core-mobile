import CreateWallet from 'screens/onboarding/CreateWallet';
import CheckMnemonic from 'screens/onboarding/CheckMnemonic';
import BiometricLogin from 'screens/onboarding/BiometricLogin';
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import CreatePin from 'screens/onboarding/CreatePIN';
import AvaNavigation from 'navigation/AvaNavigation';

const CreateWalletStack = createStackNavigator();

export const CreateWalletStackScreen = () => (
  <CreateWalletStack.Navigator
    headerMode="none"
    detachInactiveScreens={false}
    mode="card">
    <CreateWalletStack.Screen
      name={AvaNavigation.CreateWallet.CreateWallet}
      component={CreateWallet}
    />
    <CreateWalletStack.Screen
      name={AvaNavigation.CreateWallet.CheckMnemonic}
      component={CheckMnemonic}
    />
    <CreateWalletStack.Screen
      name={AvaNavigation.CreateWallet.CreatePin}
      component={CreatePin}
    />
    <CreateWalletStack.Screen
      name={AvaNavigation.CreateWallet.BiometricLogin}
      component={BiometricLogin}
    />
  </CreateWalletStack.Navigator>
);
