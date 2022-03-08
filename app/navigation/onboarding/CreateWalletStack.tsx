import AppNavigation from 'navigation/AppNavigation';
import React, {createContext, Dispatch, useContext, useState} from 'react';
import CreateWallet from 'screens/onboarding/CreateWallet';
import {useNavigation} from '@react-navigation/native';
import CheckMnemonic from 'screens/onboarding/CheckMnemonic';
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
import {useApplicationContext} from 'contexts/ApplicationContext';

type CreateWalletStackParamList = {
  [AppNavigation.CreateWallet.CreateWallet]: undefined;
  [AppNavigation.CreateWallet.ProtectFunds]: undefined;
  [AppNavigation.CreateWallet.CheckMnemonic]: undefined;
  [AppNavigation.CreateWallet.CreatePin]: undefined;
  [AppNavigation.CreateWallet.BiometricLogin]: undefined;
};
const CreateWalletS = createStackNavigator<CreateWalletStackParamList>();

const CreateWalletContext = createContext<{
  mnemonic: string;
  setMnemonic: Dispatch<string>;
}>({} as any);

const CreateWalletStack: () => JSX.Element = () => {
  const [mnemonic, setMnemonic] = useState('');

  return (
    <CreateWalletContext.Provider value={{setMnemonic, mnemonic}}>
      <CreateWalletS.Navigator screenOptions={{headerShown: false}}>
        <CreateWalletS.Screen
          options={MainHeaderOptions('Recovery Phrase')}
          name={AppNavigation.CreateWallet.CreateWallet}
          component={CreateWalletScreen}
        />
        <CreateWalletS.Screen
          options={{presentation: 'transparentModal'}}
          name={AppNavigation.CreateWallet.ProtectFunds}
          component={WarningModal}
        />
        <CreateWalletS.Screen
          options={MainHeaderOptions('Verify Phrase')}
          name={AppNavigation.CreateWallet.CheckMnemonic}
          component={CheckMnemonicScreen}
        />
        <CreateWalletS.Screen
          name={AppNavigation.CreateWallet.CreatePin}
          component={CreatePinScreen}
        />
        <CreateWalletS.Screen
          options={{headerShown: true, headerTitle: ''}}
          name={AppNavigation.CreateWallet.BiometricLogin}
          component={BiometricLoginScreen}
        />
      </CreateWalletS.Navigator>
    </CreateWalletContext.Provider>
  );
};

const CreateWalletScreen = () => {
  const createWalletContext = useContext(CreateWalletContext);
  const {navigate} =
    useNavigation<StackNavigationProp<CreateWalletStackParamList>>();

  const onSavedMyPhrase = (mnemonic: string) => {
    createWalletContext.setMnemonic(mnemonic);
    navigate(AppNavigation.CreateWallet.ProtectFunds);
  };

  return <CreateWallet onSavedMyPhrase={onSavedMyPhrase} />;
};

const WarningModal = () => {
  const {navigate, goBack} =
    useNavigation<StackNavigationProp<CreateWalletStackParamList>>();

  const onUnderstand = () => {
    goBack();
    navigate(AppNavigation.CreateWallet.CheckMnemonic);
  };

  const onBack = () => {
    goBack();
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
      <AvaButton.TextLarge style={{marginTop: 16}} onPress={onBack}>
        Back
      </AvaButton.TextLarge>
    </ModalContainer>
  );
};

const CheckMnemonicScreen = () => {
  const createWalletContext = useContext(CreateWalletContext);
  const {navigate, goBack} =
    useNavigation<StackNavigationProp<CreateWalletStackParamList>>();
  return (
    <CheckMnemonic
      onSuccess={() => {
        navigate(AppNavigation.CreateWallet.CreatePin);
      }}
      onBack={() => goBack()}
      mnemonic={createWalletContext.mnemonic}
    />
  );
};

const CreatePinScreen = () => {
  const createWalletContext = useContext(CreateWalletContext);
  const walletSetupHook = useApplicationContext().walletSetupHook;
  const {navigate} =
    useNavigation<StackNavigationProp<CreateWalletStackParamList>>();

  const onPinSet = (pin: string): void => {
    walletSetupHook
      .onPinCreated(createWalletContext.mnemonic, pin, false)
      .then(value => {
        switch (value) {
          case 'useBiometry':
            navigate(AppNavigation.CreateWallet.BiometricLogin);
            break;
          case 'enterWallet':
            walletSetupHook.enterWallet(createWalletContext.mnemonic);
            break;
        }
      });
  };

  return <CreatePIN onPinSet={onPinSet} />;
};

const BiometricLoginScreen = () => {
  const createWalletContext = useContext(CreateWalletContext);
  const walletSetupHook = useApplicationContext().walletSetupHook;
  return (
    <BiometricLogin
      mnemonic={createWalletContext.mnemonic}
      onBiometrySet={() => {
        walletSetupHook.enterWallet(createWalletContext.mnemonic);
      }}
      onSkip={() => walletSetupHook.enterWallet(createWalletContext.mnemonic)}
    />
  );
};

export default CreateWalletStack;
