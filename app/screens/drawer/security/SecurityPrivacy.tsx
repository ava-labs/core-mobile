import React, {useContext, useEffect, useState} from 'react';
import {Switch, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaListItem from 'components/AvaListItem';
import {StackActions, useNavigation} from '@react-navigation/native';
import BiometricsSDK from 'utils/BiometricsSDK';
import AppNavigation from 'navigation/AppNavigation';
import AppViewModel from 'AppViewModel';

function SecurityPrivacy() {
  const theme = useContext(ApplicationContext).theme;
  const {dispatch} = useNavigation();
  const [isBiometricSwitchEnabled, setIsBiometricSwitchEnabled] =
    useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  useEffect(() => {
    BiometricsSDK.canUseBiometry().then((biometryAvailable: boolean) => {
      setIsBiometricEnabled(biometryAvailable);
    });
  }, []);

  useEffect(() => {
    if (isBiometricSwitchEnabled) {
      console.log(isBiometricSwitchEnabled);
    }
  }, [isBiometricSwitchEnabled]);

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

  return (
    <View style={{backgroundColor: theme.bgOnBgApp}}>
      <AvaListItem.Base
        title={'Change password'}
        showNavigationArrow
        onPress={() => dispatch(resetAction)}
      />
      <AvaListItem.Base
        title={'Show recovery phrase'}
        showNavigationArrow
        onPress={() => dispatch(revealAction)}
      />
      {isBiometricEnabled && (
        <AvaListItem.Base
          title={'Sign in with Biometrics'}
          rightComponent={
            <Switch
              value={isBiometricSwitchEnabled}
              onValueChange={setIsBiometricSwitchEnabled}
            />
          }
        />
      )}
    </View>
  );
}

export default SecurityPrivacy;
