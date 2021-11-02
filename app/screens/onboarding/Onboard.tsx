import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaButton from 'components/AvaButton';
import {Space} from 'components/Space';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import AvaText from 'components/AvaText';

type Props = {
  onCreateWallet: () => void;
  onAlreadyHaveWallet: () => void;
  onEnterWallet: (mnemonic: string) => void;
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../../../package.json');

export default function Onboard(props: Props | Readonly<Props>): JSX.Element {
  const context = useApplicationContext();

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
        <AvaText.LargeTitleBold textStyle={{textAlign: 'center'}}>
          Wallet
        </AvaText.LargeTitleBold>
        <Space y={8} />
        <AvaText.Body1 textStyle={{textAlign: 'center'}}>
          Your simple and secure crypto wallet
        </AvaText.Body1>
      </View>

      <AvaButton.TextLarge onPress={onAlreadyHaveWallet}>
        I already have a wallet
      </AvaButton.TextLarge>

      <Space y={16} />

      <AvaButton.PrimaryLarge onPress={onCreateWallet}>
        Create new wallet
      </AvaButton.PrimaryLarge>

      <AvaText.Body2 textStyle={{position: 'absolute', top: 0, left: 16}}>
        v{pkg.version}
      </AvaText.Body2>
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
