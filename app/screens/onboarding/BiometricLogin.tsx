import React, {useContext} from 'react';
import {Alert, Image, StyleSheet, View} from 'react-native';
import TextTitle from 'components/TextTitle';
import TextLabel from 'components/TextLabel';
import ButtonAvaTextual from 'components/ButtonAvaTextual';
import ButtonAva from 'components/ButtonAva';
import {useBiometricLogin} from './BiometricLoginViewModel';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import {ApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  wallet: MnemonicWallet;
  onSkip: () => void;
  onBiometrySet: () => void;
};

export default function BiometricLogin(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);

  const [biometryType, onUseBiometry, fingerprintIcon] = useBiometricLogin(
    props.wallet,
    context.isDarkMode,
  );

  return (
    <View style={styles.verticalLayout}>
      <View style={styles.centerLayout}>
        <Image
          source={fingerprintIcon}
          style={[
            {
              width: 120,
              height: 120,
            },
          ]}
        />
        <View style={[{height: 90}]} />
        <TextTitle text={'Biometric Login'} size={24} bold />
        <TextLabel
          text={'Sign in quickly using your ' + biometryType?.toLowerCase()}
        />
        <TextLabel text={'Change this anytime in settings'} />
      </View>

      <ButtonAvaTextual text={'Skip'} onPress={props.onSkip} />
      <ButtonAva
        text={'Use ' + biometryType?.toLowerCase()}
        onPress={() => {
          onUseBiometry().subscribe({
            error: err => Alert.alert(err?.message || 'error'),
            complete: () => props.onBiometrySet(),
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  verticalLayout: {
    justifyContent: 'flex-end',
    height: '100%',
  },
  centerLayout: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
