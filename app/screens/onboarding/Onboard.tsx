import React, {useContext, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import TextTitle from 'components/TextTitle';
import TextLabel from 'components/TextLabel';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {useNetworkContext} from '@avalabs/wallet-react-components';
import AvaButton from 'components/AvaButton';
import {Space} from 'components/Space';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';

type Props = {
  onCreateWallet: () => void;
  onAlreadyHaveWallet: () => void;
  onEnterWallet: (mnemonic: string) => void;
};

const pkg = require('../../../package.json');

export default function Onboard(props: Props | Readonly<Props>): JSX.Element {
  const context = useContext(ApplicationContext);
  const networkContext = useNetworkContext();
  const [networkName, setNetworkName] = useState('');

  useEffect(() => {
    setNetworkName(networkContext?.network?.name ?? '');
  }, [networkContext?.network]);

  const onCreateWallet = (): void => {
    props.onCreateWallet();
  };

  const onAlreadyHaveWallet = (): void => {
    props.onAlreadyHaveWallet();
  };

  return (
    <View style={styles.verticalLayout}>
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <AvaLogoSVG
            logoColor={context.theme.colorPrimary1}
            backgroundColor={context.theme.transparent}
          />
        </View>
        <TextTitle text={'Wallet'} textAlign={'center'} bold={true} size={36} />
        <Space y={8} />
        <TextTitle
          text={'Your simple and secure crypto wallet'}
          textAlign={'center'}
          size={16}
        />
      </View>

      <AvaButton.TextLarge onPress={onAlreadyHaveWallet}>
        I already have a wallet
      </AvaButton.TextLarge>

      <Space y={16} />

      <AvaButton.PrimaryLarge onPress={onCreateWallet}>
        Create new wallet
      </AvaButton.PrimaryLarge>
      <TextLabel text={'v' + pkg.version + ' ' + networkName} />
    </View>
  );
}

const styles = StyleSheet.create({
  verticalLayout: {
    padding: 16,
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
    display: 'flex',
    alignItems: 'center',
  },
});
