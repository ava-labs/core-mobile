import React, {useContext, useState} from 'react';
import {Modal, StyleSheet, View} from 'react-native';
import InputText from 'components/InputText';
import AvaButton from 'components/AvaButton';
import Loader from 'components/Loader';
import QrScannerAva from 'components/QrScannerAva';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {useNavigation} from '@react-navigation/native';
import AppNavigation from 'navigation/AppNavigation';
import AvaText from 'components/AvaText';
import FlexSpacer from 'components/FlexSpacer';
import {SendERC20Context} from 'contexts/SendERC20Context';
import {ScanQrIcon} from 'screens/send/ScanQrIcon';

export default function SendERC20(): JSX.Element {
  const context = useContext(ApplicationContext);
  const {
    sendAmountString,
    errorMsg,
    clearErrorMsg,
    setSendAmountString,
    sendFeeString,
    setAddress,
    destinationAddress,
    onScanBarcode,
    canSubmit,
    loaderVisible,
    loaderMsg,
    setCameraVisible,
    cameraVisible,
    onBarcodeScanned,
  } = useContext(SendERC20Context);
  const [backgroundStyle] = useState(context.backgroundStyle);
  const {navigate} = useNavigation();

  return (
    <View
      style={[
        backgroundStyle,
        {
          backgroundColor: undefined,
          paddingStart: 0,
          paddingEnd: 0,
          paddingBottom: 0,
        },
      ]}>
      <View style={[{paddingStart: 4, paddingEnd: 4, marginTop: 20}]}>
        <InputText
          value={sendAmountString}
          label="Amount"
          placeholder="Enter the amount"
          helperText="$0"
          errorText={errorMsg.startsWith('Amount') ? errorMsg : undefined}
          keyboardType="numeric"
          onChangeText={text => {
            clearErrorMsg();
            setSendAmountString(text);
          }}
        />
        <View style={styles.transactionFee}>
          <AvaText.Body3
            textStyle={{
              textAlign: 'right',
              color: context.theme.txtListItemSubscript,
            }}>
            {'Transaction fee: ' + sendFeeString}
          </AvaText.Body3>
        </View>
      </View>

      <View style={styles.horizontalLayout}>
        <View style={[{flex: 1, paddingStart: 4, paddingEnd: 4}]}>
          <InputText
            label={'Address'}
            placeholder="Enter the address"
            multiline={true}
            errorText={errorMsg.indexOf('address') !== -1 ? errorMsg : undefined}
            onChangeText={text => {
              setAddress(text);
              clearErrorMsg();
            }}
            value={destinationAddress}
          />
          {destinationAddress.length === 0 && (
            <ScanQrIcon onScanBarcode={onScanBarcode} />
          )}
        </View>
      </View>

      <FlexSpacer />

      <AvaButton.PrimaryLarge
        disabled={!canSubmit}
        style={{margin: 16}}
        onPress={() =>
          navigate(AppNavigation.SendToken.ConfirmTransactionScreen)
        }>
        Next
      </AvaButton.PrimaryLarge>

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
    position: 'absolute',
    bottom: 14,
    right: 16,
    alignItems: 'flex-end',
  },
});
