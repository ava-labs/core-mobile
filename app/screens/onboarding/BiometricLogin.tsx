import React, {useContext} from 'react';
import {Alert, Image, StyleSheet, View} from 'react-native';
import TextTitle from 'components/TextTitle';
import TextLabel from 'components/TextLabel';
import ButtonAvaTextual from 'components/ButtonAvaTextual';
import ButtonAva from 'components/ButtonAva';
import {useBiometricLogin} from './BiometricLoginViewModel';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AppViewModel from 'AppViewModel';
import {useNavigation} from '@react-navigation/native';
import {useWalletContext} from '@avalabs/wallet-react-components';

export default function BiometricLogin() {
  const context = useContext(ApplicationContext);
  const walletContext = useWalletContext();
  const {navigate} = useNavigation();
  const mnemonic = AppViewModel.mnemonic;
  const [biometryType, onUseBiometry, fingerprintIcon] = useBiometricLogin(
    mnemonic,
    context.isDarkMode,
  );

  const initWalletAndNavigate = () => {
    AppViewModel.onEnterWallet(mnemonic)
      .then(() => walletContext?.setMnemonic(mnemonic))
      .then(() => navigate('App', {screen: 'Home'}));
  };

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
        <View style={[{height: 8}]} />
        <TextLabel
          text={'Sign in quickly using your ' + biometryType?.toLowerCase()}
        />
        <TextLabel text={'Change this anytime in settings'} />
      </View>

      <ButtonAvaTextual text={'Skip'} onPress={initWalletAndNavigate} />
      <ButtonAva
        text={'Use ' + biometryType?.toLowerCase()}
        onPress={() => {
          onUseBiometry().subscribe({
            error: err => Alert.alert(err?.message || 'error'),
            complete: initWalletAndNavigate,
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
