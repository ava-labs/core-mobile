import React, {useContext, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import WalletSDK from 'utils/WalletSDK';
import TextArea from 'components/TextArea';
import AvaText from 'components/AvaText';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaButton from 'components/AvaButton';

type Props = {
  onEnterWallet: (mnemonic: string) => void;
  onBack: () => void;
};

export default function HdWalletLogin(
  props: Props | Readonly<Props>,
): JSX.Element {
  const context = useContext(ApplicationContext);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );

  const onEnterTestWallet = (): void => {
    props.onEnterWallet(WalletSDK.testMnemonic());
  };

  const onBack = (): void => {
    props.onBack();
  };

  const onEnterWallet = (mnemonic: string) => {
    try {
      WalletSDK.getMnemonicValet(mnemonic);
      props.onEnterWallet(mnemonic);
    } catch (e) {
      setErrorMessage('Invalid recovery phrase');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.fullHeight}
      keyboardShouldPersistTaps="handled">
      <View style={styles.fullHeight}>
        <AvaText.LargeTitleBold
          textStyle={{textAlign: 'center', marginTop: 100}}>
          Wallet
        </AvaText.LargeTitleBold>
        <View
          style={[styles.overlay, {backgroundColor: context.theme.overlay}]}
        />
        <View style={[{flexGrow: 1, justifyContent: 'flex-end'}]}>
          <AvaButton.TextLarge onPress={onEnterTestWallet}>
            Enter test HD wallet
          </AvaButton.TextLarge>
          <View style={[{padding: 16}]}>
            <TextArea
              autoFocus
              btnPrimaryText={'Sign in'}
              btnSecondaryText={'Cancel'}
              heading={'Recovery phrase'}
              onBtnSecondary={onBack}
              onChangeText={() => setErrorMessage(undefined)}
              errorMessage={errorMessage}
              onBtnPrimary={onEnterWallet}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fullHeight: {
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
});
