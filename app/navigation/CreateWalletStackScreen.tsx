import React, {memo} from 'react';
import CreateWallet from 'screens/onboarding/CreateWallet';
import CheckMnemonic from 'screens/onboarding/CheckMnemonic';
import BiometricLogin from 'screens/onboarding/BiometricLogin';
import {createStackNavigator} from '@react-navigation/stack';
import CreatePIN from 'screens/onboarding/CreatePIN';
import AppNavigation from 'navigation/AppNavigation';
import AppViewModel, {SelectedView} from 'AppViewModel';
import {Alert} from 'react-native';

const CreateWalletStack = createStackNavigator();

export const CreateWalletStackScreen = () => {

  /**
   * Callbacks
   */

  const onSavedMnemonic = (mnemonic: string): void => {
    AppViewModel.onSavedMnemonic(mnemonic);
  };

  const onPinSet = (pin: string): void => {
    AppViewModel.onPinCreated(pin, false).subscribe({
      error: err => Alert.alert(err.message),
    });
  };

  /**
   * Views with Props
   */
  const CreateWalletScreen = memo(() => {
    return (
      <CreateWallet
        onSavedMyPhrase={onSavedMnemonic}
        onBack={() => AppViewModel.onBackPressed()}
      />
    );
  });

  const CheckMnemonicScreen = memo(() => {
    return (
      <CheckMnemonic
        onSuccess={() => AppViewModel.setSelectedView(SelectedView.CreatePin)}
        onBack={() => AppViewModel.onBackPressed()}
        mnemonic={AppViewModel.mnemonic}
      />
    );
  });

  const CreatePinScreen = memo(() => {
    return (
      <CreatePIN
        onPinSet={onPinSet}
        onBack={() => AppViewModel.onBackPressed()}
      />
    );
  });

  const BiometricLoginScreen = memo(() => {
    return (
      <BiometricLogin
        mnemonic={AppViewModel.mnemonic}
        onBiometrySet={() => {
          AppViewModel.onEnterWallet(AppViewModel.mnemonic);
        }}
        onSkip={() => AppViewModel.onEnterWallet(AppViewModel.mnemonic)}
      />
    );
  });

  return (
    <CreateWalletStack.Navigator
      screenOptions={{headerShown: false, presentation: 'card'}}>
      <CreateWalletStack.Screen
        name={AppNavigation.CreateWallet.CreateWallet}
        component={CreateWalletScreen}
      />
      <CreateWalletStack.Screen
        name={AppNavigation.CreateWallet.CheckMnemonic}
        component={CheckMnemonicScreen}
      />
      <CreateWalletStack.Screen
        name={AppNavigation.CreateWallet.CreatePin}
        component={CreatePinScreen}
      />
      <CreateWalletStack.Screen
        name={AppNavigation.CreateWallet.BiometricLogin}
        component={BiometricLoginScreen}
      />
    </CreateWalletStack.Navigator>
  );
};
