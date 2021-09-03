import React, {useContext, useEffect, useState} from 'react';
import {Modal, SafeAreaView, StyleSheet, View} from 'react-native';
import ButtonAva from 'components/ButtonAva';
import TextTitle from 'components/TextTitle';
import InputText from 'components/InputText';
import Loader from 'components/Loader';
import QrScannerAva from 'components/QrScannerAva';
import Header from 'screens/mainView/Header';
import ImgButtonAva from 'components/ImgButtonAva';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import {ApplicationContext} from 'contexts/ApplicationContext';
import Divider from 'components/Divider';
import {useBalances} from 'screens/portfolio/BalancesHook';
import {useSendAvaxX} from 'screens/sendAvax/SendAvaxXHook';

type SendAvaxXProps = {
  wallet: MnemonicWallet;
  onClose: () => void;
};

export default function SendAvaxX(
  props: SendAvaxXProps | Readonly<SendAvaxXProps>,
) {
  const context = useContext(ApplicationContext);
  const [
    targetChain,
    loaderVisible,
    loaderMsg,
    errorMsg,
    cameraVisible,
    setCameraVisible,
    address,
    setAddress,
    sendAmountString,
    setSendAmountString,
    sendFeeString,
    onSendAvax,
    onScanBarcode,
    onBarcodeScanned,
    clearAddress,
  ] = useSendAvaxX(props.wallet);
  const [isDarkMode] = useState(context.isDarkMode);
  const [backgroundStyle] = useState(context.backgroundStyle);
  const [balanceText, setBalanceText] = useState('Balance:');
  const {availableTotal} = useBalances(props.wallet);

  useEffect(() => {
    setBalanceText('Balance: ' + availableTotal);
  }, [availableTotal]);

  const scanIcon = isDarkMode
    ? require('assets/icons/qr_scan_dark.png')
    : require('assets/icons/qr_scan_light.png');

  return (
    <SafeAreaView style={backgroundStyle}>
      <Header showBack onBack={props.onClose} />
      <Divider size={12} />
      <TextTitle
        textAlign="center"
        text={
          'Send AVAX ' + (targetChain ? ' (' + targetChain + ' Chain)' : '')
        }
        size={24}
        bold
      />
      <Divider size={8} />
      <TextTitle text={balanceText} textAlign="center" size={16} />
      <Divider size={20} />
      <View style={styles.horizontalLayout}>
        <View style={[{flex: 1}]}>
          <InputText
            label="Address"
            placeholder="Enter the address"
            multiline={true}
            onChangeText={text => setAddress(text)}
            value={address}
          />
        </View>
        <View>
          <ImgButtonAva src={scanIcon} onPress={() => onScanBarcode()} />
        </View>
      </View>

      <View style={[{flex: 1}]}>
        <InputText
          value={sendAmountString}
          label="Amount"
          placeholder="Enter the amount"
          helperText="$0"
          keyboardType="numeric"
          onChangeText={text => setSendAmountString(text)}
        />
        <View style={styles.transactionFee}>
          <TextTitle
            textAlign="right"
            color={context.theme.txtListItemSubscript}
            text={'Transaction fee: ' + sendFeeString + ' AVAX'}
            size={12}
          />
        </View>
      </View>

      <ButtonAva text={'Send'} onPress={onSendAvax} />

      <Modal animationType="fade" transparent={true} visible={loaderVisible}>
        <Loader message={loaderMsg} />
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCameraVisible(false)}
        visible={cameraVisible}>
        <QrScannerAva
          onSuccess={data => onBarcodeScanned(data)}
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
  },
  transactionFee: {
    position: 'relative',
    bottom: 30,
    right: 16,
    alignItems: 'flex-end',
  },
});
