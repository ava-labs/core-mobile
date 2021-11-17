import React from 'react';
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin';
import HdWalletLogin from 'screens/login/HdWalletLogin';
import {createStackNavigator} from '@react-navigation/stack';
import {CreateWalletStackScreen} from './CreateWalletStackScreen';
import Onboard from 'screens/onboarding/Onboard';
import AppNavigation from 'navigation/AppNavigation';
import {View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {noop} from 'rxjs';
import {SelectedView} from 'AppViewModel';

const AuthStack = createStackNavigator();

const LoginWithMnemonicScreen = () => {
  const {onEnterExistingMnemonic, onBackPressed} =
    useApplicationContext().appHook;
  return (
    <HdWalletLogin
      onEnterWallet={mnemonic => onEnterExistingMnemonic(mnemonic)}
      onBack={() => onBackPressed()}
    />
  );
};

const LoginWithPinOrBiometryScreen = () => {
  const {setSelectedView, onEnterWallet} = useApplicationContext().appHook;
  return (
    <PinOrBiometryLogin
      onSignInWithRecoveryPhrase={() =>
        setSelectedView(SelectedView.LoginWithMnemonic)
      }
      onEnterWallet={mnemonic => {
        onEnterWallet(mnemonic);
      }}
    />
  );
};

const OnboardScreen = () => {
  const {setSelectedView} = useApplicationContext().appHook;
  return (
    <Onboard
      onAlreadyHaveWallet={() =>
        setSelectedView(SelectedView.LoginWithMnemonic)
      }
      onCreateWallet={() => setSelectedView(SelectedView.CreateWallet)}
      onEnterWallet={() => noop}
    />
  );
};

export const OnboardStackScreen = () => {
  const {theme} = useApplicationContext();

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: {backgroundColor: theme.colorBg2},
      }}>
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
