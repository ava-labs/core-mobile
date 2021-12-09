import React, {memo} from 'react';
import AppNavigation from 'navigation/AppNavigation';
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin';
import CreatePIN from 'screens/onboarding/CreatePIN';
import SecurityPrivacy from 'screens/drawer/security/SecurityPrivacy';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {MainHeaderOptions} from 'navigation/NavUtils';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {createStackNavigator} from '@react-navigation/stack';
import BiometricsSDK from 'utils/BiometricsSDK';
import RevealMnemonic from 'navigation/wallet/RevealMnemonic';

const SecurityStack = createStackNavigator();

const SecurityPrivacyScreen = () => {
  const nav = useNavigation<NativeStackNavigationProp<any>>();
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
  const {onSavedMnemonic} = useApplicationContext().appHook;
  const nav = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <PinOrBiometryLogin
      onLoginSuccess={mnemonic => {
        onSavedMnemonic(mnemonic, true);
        nav.replace(AppNavigation.SecurityPrivacy.CreatePin);
      }}
      onSignInWithRecoveryPhrase={() => console.log('onSignIn')}
      isResettingPin
    />
  );
});

const PinOrBiometryLoginForRecoveryReveal = memo(() => {
  const {onSavedMnemonic} = useApplicationContext().appHook;
  const nav = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <PinOrBiometryLogin
      onLoginSuccess={mnemonic => {
        onSavedMnemonic(mnemonic, true);
        nav.replace(AppNavigation.SecurityPrivacy.RecoveryPhrase);
      }}
      onSignInWithRecoveryPhrase={() => console.log('onSignIn')}
      hideLoginWithMnemonic
    />
  );
});

const PinForBiometryEnable = memo(() => {
  const nav = useNavigation<NativeStackNavigationProp<any>>();

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
  const {onPinCreated} = useApplicationContext().appHook;
  const nav = useNavigation<NativeStackNavigationProp<any>>();
  return (
    <CreatePIN
      onBack={() => nav.goBack()}
      onPinSet={pin => {
        onPinCreated(pin, true).subscribe({
          error: () => console.log('ignored'),
        });
        nav.goBack();
      }}
      isResettingPin
    />
  );
});

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

export default SecurityPrivacyStackScreen;
