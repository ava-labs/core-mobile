import AppNavigation from 'navigation/AppNavigation';
import React from 'react';
import Welcome from 'screens/onboarding/Welcome';
import {noop} from 'rxjs';
import CreateWalletStack from 'navigation/onboarding/CreateWalletStack';
import {useNavigation} from '@react-navigation/native';
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin';
import EnterWithMnemonicStack from 'navigation/onboarding/EnterWithMnemonicStack';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import {useApplicationContext} from 'contexts/ApplicationContext';

type WelcomeScreenStackParamList = {
  [AppNavigation.Onboard.Welcome]: undefined;
  [AppNavigation.Onboard.CreateWalletStack]: undefined;
  [AppNavigation.Onboard.EnterWithMnemonicStack]: undefined;
  [AppNavigation.Onboard.Login]: undefined;
};
const WelcomeScreenS = createStackNavigator<WelcomeScreenStackParamList>();

const WelcomeScreen = () => {
  const {navigate} =
    useNavigation<StackNavigationProp<WelcomeScreenStackParamList>>();
  return (
    <Welcome
      onAlreadyHaveWallet={() =>
        navigate(AppNavigation.Onboard.EnterWithMnemonicStack)
      }
      onCreateWallet={() => navigate(AppNavigation.Onboard.CreateWalletStack)}
      onEnterWallet={() => noop}
    />
  );
};

const LoginWithPinOrBiometryScreen = () => {
  const {enterWallet} = useApplicationContext().walletSetupHook;
  const {goBack} = useNavigation();
  return (
    <PinOrBiometryLogin
      onSignInWithRecoveryPhrase={() => goBack()}
      onLoginSuccess={mnemonic => {
        enterWallet(mnemonic);
      }}
    />
  );
};

const WelcomeScreenStack: () => JSX.Element = () => (
  <WelcomeScreenS.Navigator screenOptions={{headerShown: false}}>
    <WelcomeScreenS.Screen
      name={AppNavigation.Onboard.Welcome}
      component={WelcomeScreen}
    />
    <WelcomeScreenS.Screen
      name={AppNavigation.Onboard.CreateWalletStack}
      component={CreateWalletStack}
    />
    <WelcomeScreenS.Screen
      name={AppNavigation.Onboard.EnterWithMnemonicStack}
      component={EnterWithMnemonicStack}
    />
    <WelcomeScreenS.Screen
      options={{presentation: 'modal'}}
      name={AppNavigation.Onboard.Login}
      component={LoginWithPinOrBiometryScreen}
    />
  </WelcomeScreenS.Navigator>
);

export default WelcomeScreenStack;
