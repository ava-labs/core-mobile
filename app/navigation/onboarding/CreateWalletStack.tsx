import AppNavigation from 'navigation/AppNavigation';
import React from 'react';
import CreateWallet from 'screens/onboarding/CreateWallet';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
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
import ModalContainer from 'components/ModalContainer';
import AvaText from 'components/AvaText';
import AvaButton from 'components/AvaButton';

type CreateWalletStackParamList = {
  [AppNavigation.CreateWallet.CreateWallet]: undefined;
  [AppNavigation.CreateWallet.CheckMnemonic]: undefined;
  [AppNavigation.CreateWallet.CreatePin]: undefined;
  [AppNavigation.CreateWallet.BiometricLogin]: undefined;
  [AppNavigation.CreateWallet.ProtectFunds]: {mnemonic: string};
};
const CreateWalletS = createStackNavigator<CreateWalletStackParamList>();

const CreateWalletScreen = () => {
  const navigation =
    useNavigation<StackNavigationProp<CreateWalletStackParamList>>();

  return (
    <CreateWallet
      onSavedMyPhrase={mnemonic =>
        navigation.navigate(AppNavigation.CreateWallet.ProtectFunds, {mnemonic})
      }
    />
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

const WarningModal = () => {
  const {onSavedMnemonic} = useApplicationContext().appHook;
  const {goBack} = useNavigation();
  const mnemonic =
    useRoute<RouteProp<CreateWalletStackParamList>>()?.params?.mnemonic;

  const onUnderstand = () => {
    goBack(); //dismiss this modal from stack
    mnemonic && onSavedMnemonic(mnemonic);
  };

  return (
    <ModalContainer>
      <AvaText.Heading2 textStyle={{marginTop: 8, textAlign: 'center'}}>
        Protect Your Funds
      </AvaText.Heading2>
      <AvaText.Body2 textStyle={{textAlign: 'center', marginTop: 16}}>
        Losing this phrase will result in lost funds. Please be sure to store it
        in a secure location.
      </AvaText.Body2>
      <AvaButton.PrimaryLarge style={{marginTop: 28}} onPress={onUnderstand}>
        I understand
      </AvaButton.PrimaryLarge>
      <AvaButton.TextLarge style={{marginTop: 16}} onPress={() => goBack()}>
        Back
      </AvaButton.TextLarge>
    </ModalContainer>
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
    <CreateWalletS.Screen
      options={{presentation: 'transparentModal'}}
      name={AppNavigation.CreateWallet.ProtectFunds}
      component={WarningModal}
    />
  </CreateWalletS.Navigator>
);

export default CreateWalletStack;
