import AppNavigation from 'navigation/AppNavigation';
import React from 'react';
import CreateWallet from 'screens/onboarding/CreateWallet';
import {useNavigation} from '@react-navigation/native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import CheckMnemonic from 'screens/onboarding/CheckMnemonic';
import {Alert} from 'react-native';
import CreatePIN from 'screens/onboarding/CreatePIN';
import BiometricLogin from 'screens/onboarding/BiometricLogin';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import {MainHeaderOptions} from 'navigation/NavUtils';

type CreateWalletStackParamList = {
  [AppNavigation.CreateWallet.CreateWallet]: undefined;
  [AppNavigation.CreateWallet.CheckMnemonic]: undefined;
  [AppNavigation.CreateWallet.CreatePin]: undefined;
  [AppNavigation.CreateWallet.BiometricLogin]: undefined;
};
const CreateWalletS = createStackNavigator<CreateWalletStackParamList>();

const CreateWalletScreen = () => {
  const {onSavedMnemonic} = useApplicationContext().appHook;
  return (
    <CreateWallet onSavedMyPhrase={mnemonic => onSavedMnemonic(mnemonic)} />
  );
};

const CheckMnemonicScreen = () => {
  const {mnemonic, setIsNewWallet} = useApplicationContext().appHook;
  const {navigate, goBack} =
    useNavigation<StackNavigationProp<CreateWalletStackParamList>>();
  return (
    <CheckMnemonic
      onSuccess={() => {
        setIsNewWallet(true);
        navigate(AppNavigation.CreateWallet.CreatePin);
      }}
      onBack={() => goBack()}
      mnemonic={mnemonic}
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

const CreateWalletStack: () => JSX.Element = () => (
  <CreateWalletS.Navigator screenOptions={{headerShown: false}}>
    <CreateWalletS.Screen
      options={MainHeaderOptions('Recovery Phrase')}
      name={AppNavigation.CreateWallet.CreateWallet}
      component={CreateWalletScreen}
    />
    <CreateWalletS.Screen
      name={AppNavigation.CreateWallet.CheckMnemonic}
      component={CheckMnemonicScreen}
    />
    <CreateWalletS.Screen
      name={AppNavigation.CreateWallet.CreatePin}
      component={CreatePinScreen}
    />
    <CreateWalletS.Screen
      name={AppNavigation.CreateWallet.BiometricLogin}
      component={BiometricLoginScreen}
    />
  </CreateWalletS.Navigator>
);

export default CreateWalletStack;
