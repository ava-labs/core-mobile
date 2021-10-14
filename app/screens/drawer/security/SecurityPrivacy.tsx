import React, {useContext, useEffect, useState} from 'react';
import {Switch, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaListItem from 'components/AvaListItem';
import {StackActions, useNavigation} from '@react-navigation/native';
import BiometricsSDK, {KeystoreConfig} from 'utils/BiometricsSDK';
import AppNavigation from 'navigation/AppNavigation';
import AppViewModel from 'AppViewModel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SECURE_ACCESS_SET} from 'resources/Constants';
import {
  MnemonicLoaded,
  NothingToLoad,
  PrivateKeyLoaded,
  usePinOrBiometryLogin,
  WalletLoadingResults,
} from 'screens/login/PinOrBiometryLoginViewModel';
import {UserCredentials} from 'react-native-keychain';

function SecurityPrivacy() {
  const theme = useContext(ApplicationContext).theme;
  const {dispatch} = useNavigation();
  const [isBiometricSwitchEnabled, setIsBiometricSwitchEnabled] =
    useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [promptForWalletLoadingIfExists] = usePinOrBiometryLogin();

  useEffect(() => {
    BiometricsSDK.canUseBiometry().then((biometryAvailable: boolean) => {
      setIsBiometricEnabled(biometryAvailable);
    });
    AsyncStorage.getItem(SECURE_ACCESS_SET).then(type =>
      setIsBiometricSwitchEnabled(type === 'BIO'),
    );
  }, []);

  const resetPinAction = StackActions.push(AppNavigation.CreateWallet.CreatePin);
  const showMnemonicAction = StackActions.push(
    AppNavigation.CreateWallet.CreateWallet,
  );
  const resetAction = StackActions.push(AppNavigation.Onboard.Login);
  const revealAction = StackActions.push(AppNavigation.Onboard.Login, {
    revealMnemonic: (mnemonic: string) => {
      AppViewModel.onSavedMnemonic(mnemonic, true);
      dispatch(showMnemonicAction);
    },
  });

  const handleSwitchChange = (value: boolean) => {
    setIsBiometricSwitchEnabled(value);
    if (value) {
      dispatch(
        StackActions.push(AppNavigation.Onboard.Login, {
          revealMnemonic: async (mnemonic: string) => {
            await BiometricsSDK.storeWalletWithBiometry(mnemonic);
          },
        }),
      );
    } else {
      AsyncStorage.setItem(SECURE_ACCESS_SET, 'PIN');
    }
  };

  const handleReset = async () => {
    if (isBiometricSwitchEnabled) {
      const mnemonic = (await BiometricsSDK.loadWalletKey(
        KeystoreConfig.KEYSTORE_BIO_OPTIONS,
      )) as UserCredentials;
      AppViewModel.onSavedMnemonic(mnemonic.password, true);
      dispatch(resetPinAction);
    } else {
      dispatch(resetAction);
    }
  };

  const handleReveal = async () => {
    if (isBiometricSwitchEnabled) {
      const mnemonic = (await BiometricsSDK.loadWalletKey(
        KeystoreConfig.KEYSTORE_BIO_OPTIONS,
      )) as UserCredentials;
      AppViewModel.onSavedMnemonic(mnemonic.password, true);
      dispatch(showMnemonicAction);
    } else {
      dispatch(revealAction);
    }
  };

  return (
    <View style={{backgroundColor: theme.bgOnBgApp}}>
      <AvaListItem.Base
        title={'Change password'}
        showNavigationArrow
        onPress={handleReset}
      />
      <AvaListItem.Base
        title={'Show recovery phrase'}
        showNavigationArrow
        onPress={handleReveal}
      />
      {isBiometricEnabled && (
        <AvaListItem.Base
          title={'Sign in with Biometrics'}
          rightComponent={
            <Switch
              value={isBiometricSwitchEnabled}
              onValueChange={handleSwitchChange}
            />
          }
        />
      )}
    </View>
  );
}

export default SecurityPrivacy;
