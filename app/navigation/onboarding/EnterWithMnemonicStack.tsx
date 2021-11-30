import AppNavigation from 'navigation/AppNavigation';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Alert} from 'react-native';
import CreatePIN from 'screens/onboarding/CreatePIN';
import BiometricLogin from 'screens/onboarding/BiometricLogin';
import HdWalletLogin from 'screens/login/HdWalletLogin';
import {createStackNavigator} from '@react-navigation/stack';

type EnterWithMnemonicStackParamList = {
  [AppNavigation.LoginWithMnemonic.LoginWithMnemonic]: undefined;
  [AppNavigation.LoginWithMnemonic.CreatePin]: undefined;
  [AppNavigation.LoginWithMnemonic.BiometricLogin]: undefined;
};
const EnterWithMnemonicS =
  createStackNavigator<EnterWithMnemonicStackParamList>();

const LoginWithMnemonicScreen = () => {
  const {onEnterExistingMnemonic} = useApplicationContext().appHook;
  const {goBack} = useNavigation();
  return (
    <HdWalletLogin
      onEnterWallet={mnemonic => onEnterExistingMnemonic(mnemonic)}
      onBack={() => goBack()}
    />
  );
};

const CreatePinScreen = () => {
  const {onPinCreated} = useApplicationContext().appHook;
  const {goBack} = useNavigation();

  const onPinSet = (pin: string): void => {
    onPinCreated(pin, false).subscribe({
      error: err => Alert.alert(err.message),
    });
  };

  return <CreatePIN onPinSet={onPinSet} onBack={() => goBack()} />;
};

const BiometricLoginScreen = () => {
  const {mnemonic, onEnterWallet, setIsNewWallet} =
    useApplicationContext().appHook;
  return (
    <BiometricLogin
      mnemonic={mnemonic}
      onBiometrySet={() => {
        setIsNewWallet(true);
        onEnterWallet(mnemonic);
      }}
      onSkip={() => onEnterWallet(mnemonic)}
    />
  );
};

const EnterWithMnemonicStack = () => (
  <EnterWithMnemonicS.Navigator screenOptions={{headerShown: false}}>
    <EnterWithMnemonicS.Screen
      name={AppNavigation.LoginWithMnemonic.LoginWithMnemonic}
      component={LoginWithMnemonicScreen}
    />
    <EnterWithMnemonicS.Screen
      name={AppNavigation.LoginWithMnemonic.CreatePin}
      component={CreatePinScreen}
    />
    <EnterWithMnemonicS.Screen
      name={AppNavigation.LoginWithMnemonic.BiometricLogin}
      component={BiometricLoginScreen}
    />
  </EnterWithMnemonicS.Navigator>
);

export default EnterWithMnemonicStack;
