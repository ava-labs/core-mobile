import AppNavigation from 'navigation/AppNavigation';
import React, {
  createContext,
  Dispatch,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {useNavigation} from '@react-navigation/native';
import CreatePIN from 'screens/onboarding/CreatePIN';
import BiometricLogin from 'screens/onboarding/BiometricLogin';
import HdWalletLogin from 'screens/login/HdWalletLogin';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import BiometricsSDK from 'utils/BiometricsSDK';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {MainHeaderOptions} from 'navigation/NavUtils';
import {usePosthogContext} from 'contexts/PosthogContext';

type EnterWithMnemonicStackParamList = {
  [AppNavigation.LoginWithMnemonic.LoginWithMnemonic]: undefined;
  [AppNavigation.LoginWithMnemonic.CreatePin]: undefined;
  [AppNavigation.LoginWithMnemonic.BiometricLogin]: undefined;
};
const EnterWithMnemonicS =
  createStackNavigator<EnterWithMnemonicStackParamList>();

const EnterWithMnemonicContext = createContext<{
  mnemonic: string;
  setMnemonic: Dispatch<string>;
}>({} as any);

const EnterWithMnemonicStack = () => {
  const [mnemonic, setMnemonic] = useState('');

  return (
    <EnterWithMnemonicContext.Provider value={{setMnemonic, mnemonic}}>
      <EnterWithMnemonicS.Navigator screenOptions={{headerShown: false}}>
        <EnterWithMnemonicS.Screen
          options={MainHeaderOptions('')}
          name={AppNavigation.LoginWithMnemonic.LoginWithMnemonic}
          component={LoginWithMnemonicScreen}
        />
        <EnterWithMnemonicS.Screen
          options={{headerShown: true, headerTitle: ''}}
          name={AppNavigation.LoginWithMnemonic.CreatePin}
          component={CreatePinScreen}
        />
        <EnterWithMnemonicS.Screen
          name={AppNavigation.LoginWithMnemonic.BiometricLogin}
          component={BiometricLoginScreen}
        />
      </EnterWithMnemonicS.Navigator>
    </EnterWithMnemonicContext.Provider>
  );
};

const LoginWithMnemonicScreen = () => {
  const enterWithMnemonicContext = useContext(EnterWithMnemonicContext);
  const {navigate, goBack, addListener, removeListener} =
    useNavigation<StackNavigationProp<EnterWithMnemonicStackParamList>>();
  const {capture} = usePosthogContext();

  useEffect(captureBackEventFx, []);

  function captureBackEventFx() {
    const callback = (e: {data: {action: {type: string}}}) => {
      if (e.data.action.type === 'GO_BACK') {
        capture('OnboardingCancelled').catch(() => undefined);
      }
    };
    addListener('beforeRemove', callback);
    return () => removeListener('beforeRemove', callback);
  }

  const onEnterWallet = useCallback(m => {
    BiometricsSDK.clearWalletKey().then(() => {
      enterWithMnemonicContext.setMnemonic(m);
      navigate(AppNavigation.LoginWithMnemonic.CreatePin);
    });
  }, []);

  return (
    <HdWalletLogin onEnterWallet={onEnterWallet} onBack={() => goBack()} />
  );
};

const CreatePinScreen = () => {
  const enterWithMnemonicContext = useContext(EnterWithMnemonicContext);
  const walletSetupHook = useApplicationContext().walletSetupHook;
  const {navigate} =
    useNavigation<StackNavigationProp<EnterWithMnemonicStackParamList>>();
  const {capture} = usePosthogContext();

  const onPinSet = (pin: string): void => {
    capture('OnboardingPasswordSet').catch(() => undefined);
    if (enterWithMnemonicContext.mnemonic) {
      walletSetupHook
        .onPinCreated(enterWithMnemonicContext.mnemonic, pin, false)
        .then(value => {
          switch (value) {
            case 'useBiometry':
              navigate(AppNavigation.LoginWithMnemonic.BiometricLogin);
              break;
            case 'enterWallet':
              walletSetupHook.enterWallet(enterWithMnemonicContext.mnemonic);
              break;
          }
        });
    }
  };
  return <CreatePIN onPinSet={onPinSet} />;
};

const BiometricLoginScreen = () => {
  const enterWithMnemonicContext = useContext(EnterWithMnemonicContext);
  const walletSetupHook = useApplicationContext().walletSetupHook;

  return (
    <BiometricLogin
      mnemonic={enterWithMnemonicContext.mnemonic}
      onBiometrySet={() => {
        walletSetupHook.enterWallet(enterWithMnemonicContext.mnemonic);
      }}
      onSkip={() =>
        walletSetupHook.enterWallet(enterWithMnemonicContext.mnemonic)
      }
    />
  );
};

export default EnterWithMnemonicStack;
