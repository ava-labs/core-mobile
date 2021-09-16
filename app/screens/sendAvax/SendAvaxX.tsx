import React, {useContext, useState} from 'react';
import {Modal, SafeAreaView, StyleSheet, View} from 'react-native';
import ButtonAva from 'components/ButtonAva';
import TextTitle from 'components/TextTitle';
import InputText from 'components/InputText';
import Loader from 'components/Loader';
import QrScannerAva from 'components/QrScannerAva';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {useSendAvaxX} from 'screens/sendAvax/SendAvaxXHook';
import QRCode from 'components/svg/QRCode';
import ButtonIcon from 'components/ButtonIcon';
import {useNavigation} from '@react-navigation/native';

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
  const {navigate} = useNavigation();

  return (
    <View style={[backgroundStyle, {backgroundColor: context.theme.bgOnBgApp}]}>
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

      <ButtonAva text={'Next'} onPress={() => navigate('Confirm Screen')} />

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
    </View>
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
