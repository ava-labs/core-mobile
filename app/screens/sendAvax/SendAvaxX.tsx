import React, {useContext, useEffect, useState} from 'react';
import {Alert, Modal, SafeAreaView, StyleSheet, View} from 'react-native';
import ButtonAva from 'components/ButtonAva';
import TextTitle from 'components/TextTitle';
import InputText from 'components/InputText';
import Loader from 'components/Loader';
import SendAvaxXViewModel from './SendAvaxXViewModel';
import QrScannerAva from 'components/QrScannerAva';
import Header from 'screens/mainView/Header';
import ImgButtonAva from 'components/ImgButtonAva';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import {ApplicationContext} from 'contexts/ApplicationContext';
import Divider from 'components/Divider';
import {useBalances} from 'screens/portfolio/BalancesHook';

type SendAvaxXProps = {
  wallet: MnemonicWallet;
  onClose: () => void;
};

export default function SendAvaxX(
  props: SendAvaxXProps | Readonly<SendAvaxXProps>,
) {
  const context = useContext(ApplicationContext);
  const [viewModel] = useState(new SendAvaxXViewModel(props.wallet));
  const [isDarkMode] = useState(context.isDarkMode);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [loaderVisible, setLoaderVisible] = useState(false);
  const [loaderMsg, setLoaderMsg] = useState('');
  const [backgroundStyle] = useState(context.backgroundStyle);
  const [addressXToSendTo, setAddressXToSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [balanceText, setBalanceText] = useState('Balance:');
  const {availableTotal} = useBalances(props.wallet);

  useEffect(() => {
    viewModel.loaderMsg.subscribe(value => setLoaderMsg(value));
    viewModel.loaderVisible.subscribe(value => setLoaderVisible(value));
    viewModel.cameraVisible.subscribe(value => setCameraVisible(value));
    viewModel.addressXToSendTo.subscribe(value => setAddressXToSendTo(value));
  }, []);

  useEffect(() => {
    setBalanceText('Balance: ' + availableTotal);
  }, [availableTotal]);

  const onSend = (addressX: string, amount: string): void => {
    viewModel.onSendAvaxX(addressX, amount).subscribe({
      next: txHash => {
        Alert.alert('Success', 'Created transaction: ' + txHash);
      },
      error: err => Alert.alert('Error', err.message),
      complete: () => {},
    });
  };

  const scanIcon = isDarkMode
    ? require('assets/icons/qr_scan_dark.png')
    : require('assets/icons/qr_scan_light.png');

  return (
    <SafeAreaView style={backgroundStyle}>
      <Header showBack onBack={props.onClose} />
      <Divider size={12} />
      <TextTitle
        textAlign="center"
        text={'Send AVAX (X Chain)'}
        size={24}
        bold
      />
      <Divider size={8} />
      <TextTitle text={balanceText} textAlign="center" size={16} />
      <Divider size={20} />
      <View style={styles.horizontalLayout}>
        <InputText
          label="Address"
          placeholder="Enter the address"
          multiline={true}
          onChangeText={text => setAddressXToSendTo(text)}
          value={addressXToSendTo}
        />
        <View>
          <ImgButtonAva
            src={scanIcon}
            onPress={() => viewModel.onScanBarcode()}
          />
        </View>
      </View>

      <InputText
        label="Amount"
        placeholder="Enter the amount"
        helperText="$0"
        onChangeText={text => setSendAmount(text)}
        value={sendAmount}
      />

      <ButtonAva
        text={'Send'}
        onPress={() => onSend(addressXToSendTo, sendAmount)}
      />

      <Modal animationType="fade" transparent={true} visible={loaderVisible}>
        <Loader message={loaderMsg} />
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCameraVisible(false)}
        visible={cameraVisible}>
        <QrScannerAva
          onSuccess={data => viewModel.onBarcodeScanned(data)}
          onCancel={() => setCameraVisible(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles: any = StyleSheet.create({
  horizontalLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    width: '100%',
  },
});
