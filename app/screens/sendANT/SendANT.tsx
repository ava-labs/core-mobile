import React, {useState} from 'react';
import {Modal, StyleSheet, View} from 'react-native';
import InputText from 'components/InputText';
import AvaButton from 'components/AvaButton';
import Loader from 'components/Loader';
import QrScannerAva from 'components/QrScannerAva';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {useNavigation} from '@react-navigation/native';
import AppNavigation from 'navigation/AppNavigation';
import AvaText from 'components/AvaText';
import FlexSpacer from 'components/FlexSpacer';
import {useSendAntContext} from 'contexts/SendANTContext';
import {ScanQrIcon} from 'screens/send/ScanQrIcon';
import {ScrollView} from 'react-native-gesture-handler';

export default function SendANT(): JSX.Element {
  const context = useApplicationContext();
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
  } = useSendAntContext();
  const [backgroundStyle] = useState(context.backgroundStyle);
  const {navigate} = useNavigation();

  return (
    <ScrollView
      contentContainerStyle={{flexGrow: 1}}
      keyboardShouldPersistTaps="handled">
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
            label="Amount"
            placeholder="Enter the amount"
            helperText="$0"
            errorText={
              errorMsg?.startsWith('Amount')
                ? errorMsg
                : errorMsg?.indexOf('balance') !== -1
                ? errorMsg
                : undefined
            }
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
              errorText={
                errorMsg?.indexOf('Address') !== -1 ? errorMsg : undefined
              }
              onChangeText={text => {
                setAddress(text);
                clearErrorMsg();
              }}
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
    </ScrollView>
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
    top: 100,
    right: 16,
    alignItems: 'flex-end',
  },
});
