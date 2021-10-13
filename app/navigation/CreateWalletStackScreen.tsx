import React from 'react';
import CreateWallet from 'screens/onboarding/CreateWallet';
import CheckMnemonic from 'screens/onboarding/CheckMnemonic';
import BiometricLogin from 'screens/onboarding/BiometricLogin';
import {createStackNavigator} from '@react-navigation/stack';
import CreatePIN from 'screens/onboarding/CreatePIN';
import AppNavigation from 'navigation/AppNavigation';
import AppViewModel, {SelectedView} from 'AppViewModel';
import {useWalletContext} from '@avalabs/wallet-react-components';
import {Alert} from 'react-native';
import {onEnterWallet} from 'App';

const CreateWalletStack = createStackNavigator();

export const CreateWalletStackScreen = () => {
  const walletContext = useWalletContext();

  /**
   * Callbacks
   */

  const onSavedMnemonic = (mnemonic: string): void => {
    AppViewModel.onSavedMnemonic(mnemonic);
  };

  const onPinSet = (pin: string): void => {
    AppViewModel.onPinCreated(pin);
    //   .subscribe({
    //   error: err => Alert.alert(err.message),
    // });
  };

  /**
   * Views with Props
   */
  const CreateWalletScreen = () => {
    return (
      <CreateWallet
        onSavedMyPhrase={onSavedMnemonic}
        onBack={() => AppViewModel.onBackPressed()}
      />
    );
  };

  const CheckMnemonicScreen = () => {
    return (
      <CheckMnemonic
        onSuccess={() => AppViewModel.setSelectedView(SelectedView.CreatePin)}
        onBack={() => AppViewModel.onBackPressed()}
        mnemonic={AppViewModel.mnemonic}
      />
    );
  };

  const CreatePinScreen = () => {
    return (
      <CreatePIN
        onPinSet={onPinSet}
        onBack={() => AppViewModel.onBackPressed()}
      />
    );
  };

  const BiometricLoginScreen = () => {
    return (
      <BiometricLogin
        mnemonic={AppViewModel.mnemonic}
        onBiometrySet={() =>
          onEnterWallet(AppViewModel.mnemonic, walletContext?.setMnemonic)
        }
        onSkip={() =>
          onEnterWallet(AppViewModel.mnemonic, walletContext?.setMnemonic)
        }
      />
    );
  };

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
