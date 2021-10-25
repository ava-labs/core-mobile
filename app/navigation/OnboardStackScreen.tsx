import React from 'react';
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin';
import HdWalletLogin from 'screens/login/HdWalletLogin';
import {createStackNavigator} from '@react-navigation/stack';
import {CreateWalletStackScreen} from './CreateWalletStackScreen';
import Onboard from 'screens/onboarding/Onboard';
import AppNavigation from 'navigation/AppNavigation';
import AppViewModel, {SelectedView} from 'AppViewModel';
import {View} from 'react-native';
import {onEnterWallet} from 'App';

const AuthStack = createStackNavigator();

const LoginWithMnemonicScreen = () => {
  return (
    <HdWalletLogin
      onEnterWallet={mnemonic => AppViewModel.onEnterExistingMnemonic(mnemonic)}
      onBack={() => AppViewModel.onBackPressed()}
    />
  );
};

const LoginWithPinOrBiometryScreen = () => {
  return (
    <PinOrBiometryLogin
      onSignInWithRecoveryPhrase={() =>
        AppViewModel.setSelectedView(SelectedView.LoginWithMnemonic)
      }
      onEnterWallet={(mnemonic, walletContext) => {
        if (!walletContext?.wallet) {
          onEnterWallet(mnemonic, walletContext?.setMnemonic);
        } else {
          AppViewModel.setSelectedView(SelectedView.Main);
        }
      }}
    />
  );
};

const OnboardScreen = () => {
  return (
    <Onboard
      onAlreadyHaveWallet={() =>
        AppViewModel.setSelectedView(SelectedView.LoginWithMnemonic)
      }
      onCreateWallet={() =>
        AppViewModel.setSelectedView(SelectedView.CreateWallet)
      }
      onEnterWallet={() => {}}
    />
  );
};

export const OnboardStackScreen = () => {
  return (
    <AuthStack.Navigator screenOptions={{headerShown: false}}>
      <AuthStack.Group>
        <AuthStack.Screen name={'init'} component={View} />
        <AuthStack.Screen
          name={AppNavigation.Onboard.Onboard}
          component={OnboardScreen}
        />
        <AuthStack.Screen
          name={AppNavigation.Onboard.LoginWithMnemonic}
          component={LoginWithMnemonicScreen}
        />
        <AuthStack.Screen
          name={AppNavigation.Onboard.CreateWalletFlow}
          component={CreateWalletStackScreen}
        />
      </AuthStack.Group>
      <AuthStack.Group screenOptions={{presentation: 'modal'}}>
        <AuthStack.Screen
          name={AppNavigation.Onboard.Login}
          component={LoginWithPinOrBiometryScreen}
        />
      </AuthStack.Group>
    </AuthStack.Navigator>
  );
};
