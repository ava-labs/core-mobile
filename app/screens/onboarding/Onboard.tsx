import React, {useContext, useEffect, useState} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import TextTitle from 'components/TextTitle';
import ButtonAva from 'components/ButtonAva';
import TextLabel from 'components/TextLabel';
import ButtonAvaSecondary from 'components/ButtonAvaSecondary';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {useNetworkContext} from '@avalabs/wallet-react-components';
import {useAuthContext} from 'hooks/AuthContext';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AvaNavigation from 'navigation/AvaNavigation';

const pkg = require('../../../package.json');

function Onboard() {
  const context = useContext(ApplicationContext);
  const networkContext = useNetworkContext();
  const {isAuthenticated} = useAuthContext();
  const {navigate} = useNavigation();
  const [networkName, setNetworkName] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('Login');
    }
    setNetworkName(networkContext?.network?.name ?? '');
  }, [networkContext?.network, isAuthenticated]);

  const navigateToLoginCreateWallet = (): void => {
    navigate(AvaNavigation.Auth.CreateWalletFlow);
  };

  const navigateToLoginWithMnemonic = () => {
    navigate(AvaNavigation.Auth.LoginWithMnemonic);
  };

  const logo = context.isDarkMode
    ? require('assets/ava_logo_dark.png')
    : require('assets/ava_logo_light.png');

  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={styles.verticalLayout}>
        <View style={styles.logoContainer}>
          <Image accessibilityRole="image" source={logo} style={styles.logo} />
          <View style={[{height: 18}]} />
          <TextTitle
            text={'Wallet'}
            textAlign={'center'}
            bold={true}
            size={36}
          />
          <View style={[{height: 8}]} />
          <TextTitle
            text={'Your simple and secure crypto wallet'}
            textAlign={'center'}
            size={16}
          />
        </View>

        <ButtonAvaSecondary
          text={'I already have a wallet'}
          onPress={navigateToLoginWithMnemonic}
        />
        <ButtonAva
          text={'Create new wallet'}
          onPress={navigateToLoginCreateWallet}
        />
        <TextLabel text={'v' + pkg.version + ' ' + networkName} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  roundButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginBottom: 52 - 8,
  },
  verticalLayout: {
    height: '100%',
    justifyContent: 'flex-end',
  },
  buttonWithText: {
    alignItems: 'center',
  },
  logoContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  logo: {
    marginTop: 0,
    height: 50,
    width: '100%',
    resizeMode: 'contain',
  },
});

export default Onboard;
