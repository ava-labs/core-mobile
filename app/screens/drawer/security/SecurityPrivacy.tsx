import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaListItem from 'components/AvaListItem';
import BiometricsSDK from 'utils/BiometricsSDK';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SECURE_ACCESS_SET} from 'resources/Constants';
import Switch from 'components/Switch';

function SecurityPrivacy({
  onChangePin,
  onShowRecoveryPhrase,
  onTurnOnBiometrics,
}: {
  onChangePin: () => void;
  onShowRecoveryPhrase: () => void;
  onTurnOnBiometrics: () => void;
}) {
  const theme = useApplicationContext().theme;
  const [isBiometricSwitchEnabled, setIsBiometricSwitchEnabled] =
    useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  useEffect(() => {
    BiometricsSDK.canUseBiometry().then((biometryAvailable: boolean) => {
      setIsBiometricEnabled(biometryAvailable);
    });
    AsyncStorage.getItem(SECURE_ACCESS_SET).then(type => {
      setIsBiometricSwitchEnabled(type === 'BIO');
    });
  }, []);

  const handleSwitchChange = (value: boolean) => {
    setIsBiometricSwitchEnabled(value);
    if (value) {
      onTurnOnBiometrics();
    } else {
      AsyncStorage.setItem(SECURE_ACCESS_SET, 'PIN');
    }
  };

  return (
    <View style={{backgroundColor: theme.colorBg2}}>
      <AvaListItem.Base
        title={'Change PIN'}
        background={theme.background}
        showNavigationArrow
        onPress={onChangePin}
      />
      <AvaListItem.Base
        title={'Show recovery phrase'}
        background={theme.background}
        showNavigationArrow
        onPress={onShowRecoveryPhrase}
      />
      {isBiometricEnabled && (
        <AvaListItem.Base
          title={'Sign in with Biometrics'}
          background={theme.background}
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
