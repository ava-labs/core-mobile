import React, {useContext, useEffect, useState} from 'react';
import {Alert, Switch, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaListItem from 'components/AvaListItem';
import {StackActions, useNavigation} from '@react-navigation/native';
import BiometricsSDK from 'utils/BiometricsSDK';

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

  const resetAction = StackActions.push('Login', {isChangingPin: true});
  const revealAction = StackActions.push('Login', {
    revealMnemonic: (mnemonic: string) => {
      Alert.alert(mnemonic);
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
