import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import Header from 'screens/mainView/Header';
import TextTitle from 'components/TextTitle';
import WalletSDK from 'utils/WalletSDK';
import RecoveryPhraseInputCard from 'components/RecoveryPhraseInputCard';
import ButtonAvaTextual from 'components/ButtonAvaTextual';
import AppViewModel from 'AppViewModel';
import {useWalletContext} from '@avalabs/wallet-react-components';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';

export default function HdWalletLogin() {
  const walletContext = useWalletContext();
  const {goBack} = useNavigation();
  const onEnterTestWallet = (): void => {
    AppViewModel.onEnterExistingMnemonic(WalletSDK.testMnemonic());
  };

  const onBack = () => {
    goBack();
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        keyboardShouldPersistTaps="handled">
        <View style={styles.verticalLayout}>
          <Header showBack onBack={onBack} />
          <View style={[{height: 8}]} />

          <TextTitle text={'Wallet'} textAlign={'center'} bold={true} />
          <View style={[{flexGrow: 1, justifyContent: 'flex-end'}]}>
            <ButtonAvaTextual
              text={'Enter test HD wallet'}
              onPress={onEnterTestWallet}
            />
            <View style={[{padding: 16}]}>
              <RecoveryPhraseInputCard
                onCancel={onBack}
                onEnter={mnemonic =>
                  AppViewModel.onEnterWallet(mnemonic).then(() =>
                    walletContext?.setMnemonic(mnemonic),
                  )
                }
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    height: '100%',
  },
  verticalLayout: {
    height: '100%',
  },
});
