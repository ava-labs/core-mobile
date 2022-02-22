import React, {memo} from 'react';
import AppNavigation from 'navigation/AppNavigation';
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin';
import CreatePIN from 'screens/onboarding/CreatePIN';
import SecurityPrivacy from 'screens/drawer/security/SecurityPrivacy';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {MainHeaderOptions} from 'navigation/NavUtils';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {createStackNavigator} from '@react-navigation/stack';
import BiometricsSDK from 'utils/BiometricsSDK';
import RevealMnemonic from 'navigation/wallet/RevealMnemonic';

export type SecurityStackParamList = {
  [AppNavigation.SecurityPrivacy.SecurityPrivacy]: undefined;
  [AppNavigation.SecurityPrivacy.PinChange]: undefined;
  [AppNavigation.SecurityPrivacy.CreatePin]: {mnemonic: string};
  [AppNavigation.SecurityPrivacy.ShowRecoveryPhrase]: undefined;
  [AppNavigation.SecurityPrivacy.TurnOnBiometrics]: undefined;
  [AppNavigation.SecurityPrivacy.RecoveryPhrase]: {mnemonic: string};
};

const SecurityStack = createStackNavigator<SecurityStackParamList>();

function SecurityPrivacyStackScreen(): JSX.Element {
  return (
    <SecurityStack.Navigator
      screenOptions={{
        headerBackTitleVisible: false,
      }}>
      <SecurityStack.Group>
        <SecurityStack.Screen
          options={MainHeaderOptions('Security & Privacy')}
          name={AppNavigation.SecurityPrivacy.SecurityPrivacy}
          component={SecurityPrivacyScreen}
        />
      </SecurityStack.Group>
      <SecurityStack.Group screenOptions={{presentation: 'modal'}}>
        <SecurityStack.Screen
          options={MainHeaderOptions('Enter your pin')}
          name={AppNavigation.SecurityPrivacy.PinChange}
          component={PinOrBiometryLoginForPassChange}
        />
        <SecurityStack.Screen
          options={MainHeaderOptions('Set new pin')}
          name={AppNavigation.SecurityPrivacy.CreatePin}
          component={CreatePinScreen}
        />
        <SecurityStack.Screen
          options={MainHeaderOptions('Enter your pin')}
          name={AppNavigation.SecurityPrivacy.ShowRecoveryPhrase}
          component={PinOrBiometryLoginForRecoveryReveal}
        />
        <SecurityStack.Screen
          options={MainHeaderOptions('Enter your pin')}
          name={AppNavigation.SecurityPrivacy.TurnOnBiometrics}
          component={PinForBiometryEnable}
        />
        <SecurityStack.Screen
          options={MainHeaderOptions('Recovery Phrase')}
          name={AppNavigation.SecurityPrivacy.RecoveryPhrase}
          component={RevealMnemonic}
        />
      </SecurityStack.Group>
    </SecurityStack.Navigator>
  );
}

const SecurityPrivacyScreen = () => {
  const nav =
    useNavigation<NativeStackNavigationProp<SecurityStackParamList>>();
  return (
    <SecurityPrivacy
      onChangePin={() => nav.navigate(AppNavigation.SecurityPrivacy.PinChange)}
      onShowRecoveryPhrase={() =>
        nav.navigate(AppNavigation.SecurityPrivacy.ShowRecoveryPhrase)
      }
      onTurnOnBiometrics={() =>
        nav.navigate(AppNavigation.SecurityPrivacy.TurnOnBiometrics)
      }
    />
  );
};

const PinOrBiometryLoginForPassChange = memo(() => {
  const nav =
    useNavigation<NativeStackNavigationProp<SecurityStackParamList>>();

  return (
    <PinOrBiometryLogin
      onLoginSuccess={mnemonic => {
        nav.replace(AppNavigation.SecurityPrivacy.CreatePin, {mnemonic});
      }}
      onSignInWithRecoveryPhrase={() => console.log('onSignIn')}
      isResettingPin
    />
  );
});

const PinOrBiometryLoginForRecoveryReveal = memo(() => {
  const nav =
    useNavigation<NativeStackNavigationProp<SecurityStackParamList>>();

  return (
    <PinOrBiometryLogin
      onLoginSuccess={mnemonic => {
        nav.replace(AppNavigation.SecurityPrivacy.RecoveryPhrase, {mnemonic});
      }}
      onSignInWithRecoveryPhrase={() => console.log('onSignIn')}
      hideLoginWithMnemonic
    />
  );
});

const PinForBiometryEnable = memo(() => {
  const nav =
    useNavigation<NativeStackNavigationProp<SecurityStackParamList>>();

  return (
    <PinOrBiometryLogin
      onLoginSuccess={mnemonic => {
        BiometricsSDK.storeWalletWithBiometry(mnemonic).then(() =>
          nav.navigate(AppNavigation.SecurityPrivacy.SecurityPrivacy),
        );
      }}
      onSignInWithRecoveryPhrase={() => console.log('onSignIn')}
      isResettingPin
    />
  );
});

const CreatePinScreen = memo(() => {
  const {onPinCreated} = useApplicationContext().walletSetupHook;
  const {mnemonic} = useRoute<RouteProp<SecurityStackParamList>>().params!;
  const nav =
    useNavigation<NativeStackNavigationProp<SecurityStackParamList>>();
  return (
    <CreatePIN
      onBack={() => nav.goBack()}
      onPinSet={pin => {
        onPinCreated(mnemonic, pin, true).then(() => nav.goBack());
      }}
      isResettingPin
    />
  );
});

export default SecurityPrivacyStackScreen;
