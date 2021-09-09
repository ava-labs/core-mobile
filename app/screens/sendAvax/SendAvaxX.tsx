import React, {useContext, useState} from 'react';
import {Modal, SafeAreaView, StyleSheet, View} from 'react-native';
import ButtonAva from 'components/ButtonAva';
import TextTitle from 'components/TextTitle';
import InputText from 'components/InputText';
import Loader from 'components/Loader';
import QrScannerAva from 'components/QrScannerAva';
import Header from 'screens/mainView/Header';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import {ApplicationContext} from 'contexts/ApplicationContext';
import Divider from 'components/Divider';
import {useSendAvaxX} from 'screens/sendAvax/SendAvaxXHook';
import QRCode from 'components/svg/QRCode';
import ButtonIcon from 'components/ButtonIcon';
import AvaToken from 'components/svg/AvaToken';

type SendAvaxXProps = {
  wallet: MnemonicWallet;
  onClose: () => void;
};

export default function SendAvaxX(
  props: SendAvaxXProps | Readonly<SendAvaxXProps>,
) {
  const context = useContext(ApplicationContext);
  const {
    avaxTotal,
    balanceTotalInUSD,
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
  } = useSendAvaxX(props.wallet);
  const [backgroundStyle] = useState(context.backgroundStyle);

  return (
    <SafeAreaView style={backgroundStyle}>
      <Header showBack onBack={props.onClose} />
      <Divider size={12} />
      <View style={styles.horizontalLayout}>
        <AvaToken />
        <Divider size={16} />
        <View>
          <TextTitle
            text={'Avalanche'}
            size={16}
            color={context.theme.txtListItem}
            bold
          />
          <TextTitle
            text={avaxTotal}
            size={24}
            color={context.theme.txtListItem}
            bold
          />
          <TextTitle
            text={balanceTotalInUSD}
            size={14}
            color={context.theme.txtListItemSubscript}
          />
        </View>
      </View>
      <Divider size={8} />
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
        <View
          style={[
            {
              position: 'absolute',
              right: 0,
              marginRight: -16,
              top: 0,
              marginTop: 32,
            },
          ]}>
          <ButtonIcon onPress={() => onScanBarcode()}>
            <QRCode />
          </ButtonIcon>
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
    position: 'relative',
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
