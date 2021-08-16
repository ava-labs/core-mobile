import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import Header from 'screens/mainView/Header';
import TextTitle from 'components/TextTitle';
import WalletSDK from 'utils/WalletSDK';
import RecoveryPhraseInputCard from 'components/RecoveryPhraseInputCard';
import ButtonAvaTextual from 'components/ButtonAvaTextual';

type Props = {
  onEnterWallet: (mnemonic: string) => void;
  onBack: () => void;
};

export default function HdWalletLogin(props: Props | Readonly<Props>) {
  const onEnterTestWallet = (): void => {
    props.onEnterWallet(WalletSDK.testMnemonic());
  };

  const onBack = (): void => {
    props.onBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollView}>
      <View style={styles.verticalLayout}>
        <Header showBack onBack={onBack} />
        <View style={[{height: 8}]} />

        <TextTitle text={'Wallet'} textAlign={'center'} bold={true} />
        <View style={[{flexGrow: 1}]} />

        <ButtonAvaTextual
          text={'Enter test HD wallet'}
          onPress={onEnterTestWallet}
        />
        <View style={[{padding: 16}]}>
          <RecoveryPhraseInputCard
            onCancel={onBack}
            onEnter={mnemonic => props.onEnterWallet(mnemonic)}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    height: '100%',
  },
  verticalLayout: {
    height: '100%',
    justifyContent: 'flex-end',
  },
});
