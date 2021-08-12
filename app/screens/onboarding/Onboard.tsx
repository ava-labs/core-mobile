import React, {useContext} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import TextTitle from 'components/TextTitle';
import ButtonAva from 'components/ButtonAva';
import TextLabel from 'components/TextLabel';
import ButtonAvaSecondary from 'components/ButtonAvaSecondary';
import {ApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  onCreateWallet: () => void;
  onAlreadyHaveWallet: () => void;
  onEnterWallet: (mnemonic: string) => void;
};

const pkg = require('../../../package.json');

export default function Onboard(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);
  const onCreateWallet = (): void => {
    props.onCreateWallet();
  };

  const onAlreadyHaveWallet = (): void => {
    props.onAlreadyHaveWallet();
  };

  const logo = context.isDarkMode
    ? require('assets/ava_logo_dark.png')
    : require('assets/ava_logo_light.png');

  return (
    <View style={styles.verticalLayout}>
      <View style={styles.logoContainer}>
        <Image accessibilityRole="image" source={logo} style={styles.logo} />
        <View style={[{height: 18}]} />
        <TextTitle text={'Wallet'} textAlign={'center'} bold={true} size={36} />
        <View style={[{height: 8}]} />
        <TextTitle
          text={'Your simple and secure crypto wallet'}
          textAlign={'center'}
          size={16}
        />
      </View>

      <ButtonAvaSecondary
        text={'I already have a wallet'}
        onPress={() => onAlreadyHaveWallet()}
      />
      <ButtonAva text={'Create new wallet'} onPress={() => onCreateWallet()} />
      <TextLabel text={'v' + pkg.version + ' Fuji network'} />
    </View>
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
