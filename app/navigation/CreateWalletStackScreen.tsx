import React, {memo} from 'react';
import CreateWallet from 'screens/onboarding/CreateWallet';
import CheckMnemonic from 'screens/onboarding/CheckMnemonic';
import BiometricLogin from 'screens/onboarding/BiometricLogin';
import {createStackNavigator} from '@react-navigation/stack';
import CreatePIN from 'screens/onboarding/CreatePIN';
import AppNavigation from 'navigation/AppNavigation';
import {Alert} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {SelectedView} from 'AppViewModel';

const CreateWalletStack = createStackNavigator();

export const CreateWalletStackScreen = () => {
  /**
   * Callbacks
   */

  /**
   * Views with Props
   */
  const CreateWalletScreen = memo(() => {
    const {onBackPressed, onSavedMnemonic} = useApplicationContext().appHook;
    return (
      <CreateWallet
        onSavedMyPhrase={mnemonic => onSavedMnemonic(mnemonic)}
        onBack={() => onBackPressed()}
      />
    );
  });

  const CheckMnemonicScreen = memo(() => {
    const {setSelectedView, onBackPressed, mnemonic} =
      useApplicationContext().appHook;
    return (
      <CheckMnemonic
        onSuccess={() => setSelectedView(SelectedView.CreatePin)}
        onBack={() => onBackPressed()}
        mnemonic={mnemonic}
      />
    );
  });

  const CreatePinScreen = memo(() => {
    const {onPinCreated, onBackPressed} = useApplicationContext().appHook;

    const onPinSet = (pin: string): void => {
      onPinCreated(pin, false).subscribe({
        error: err => Alert.alert(err.message),
      });
    };

    return <CreatePIN onPinSet={onPinSet} onBack={() => onBackPressed()} />;
  });

  const BiometricLoginScreen = memo(() => {
    const {mnemonic, onEnterWallet} = useApplicationContext().appHook;
    return (
      <BiometricLogin
        mnemonic={mnemonic}
        onBiometrySet={() => {
          onEnterWallet(mnemonic);
        }}
        onSkip={() => onEnterWallet(mnemonic)}
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
