import React, {useContext, useState} from 'react';
import {Modal, StyleSheet, View} from 'react-native';
import Header from 'screens/mainView/Header';
import ButtonAva from 'components/ButtonAva';
import Validate from './Validate';
import EarnViewModel from './EarnViewModel';
import TextTitle from 'components/TextTitle';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import {ApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  wallet: MnemonicWallet;
};

export default function EarnView(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);
  const [viewModel] = useState(new EarnViewModel(props.wallet));
  const [validateVisible, setValidateVisible] = useState(false);

  return (
    <View style={[styles.container, {backgroundColor: context.theme.bgApp}]}>
      <Header />
      <TextTitle text={'Earn'} />
      <View style={styles.buttons}>
        <ButtonAva text={'Validate'} onPress={() => setValidateVisible(true)} />
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        onRequestClose={() => setValidateVisible(false)}
        visible={validateVisible}>
        <Validate
          wallet={viewModel.wallet.value}
          onClose={() => setValidateVisible(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    paddingBottom: 88,
  },
  buttons: {
    height: '100%',
    justifyContent: 'flex-end',
  },
});
