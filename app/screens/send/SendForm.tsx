import React, {FC} from 'react';
import {StyleSheet, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import InputText from 'components/InputText';
import {bnAmountToString, stringAmountToBN} from 'dto/SendInfo';
import AvaText from 'components/AvaText';
import FlexSpacer from 'components/FlexSpacer';
import AvaButton from 'components/AvaButton';
import {ScrollView} from 'react-native-gesture-handler';
import {SendHookError} from '@avalabs/wallet-react-components';
import BN from 'bn.js';

interface Props {
  error?: SendHookError;
  setAmount: (amount: BN) => void;
  setAddress: (address: string) => void;
  sendFee?: BN;
  address?: string;
  canSubmit?: boolean;
  onNextPress?: () => void;
}

const SendForm: FC<Props> = ({
  error,
  setAmount,
  setAddress,
  sendFee,
  address,
  canSubmit,
  onNextPress,
}) => {
  const context = useApplicationContext();

  return (
    <ScrollView
      contentContainerStyle={{flexGrow: 1}}
      keyboardShouldPersistTaps="handled">
      <View
        style={[
          context.backgroundStyle,
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
              error?.message.startsWith('Amount') ? error?.message : undefined
            }
            keyboardType="numeric"
            onChangeText={text => {
              setAmount(stringAmountToBN(text));
            }}
          />
          <View style={styles.transactionFee}>
            <AvaText.Body3
              textStyle={{
                textAlign: 'right',
                color: context.theme.txtListItemSubscript,
              }}>
              {'Transaction fee: ' + bnAmountToString(sendFee)}
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
                error?.message?.toLowerCase().indexOf('address') !== -1
                  ? error?.message
                  : undefined
              }
              onChangeText={text => {
                setAddress(text);
              }}
            />
            {address?.length === 0 && (
              <View />
              // <ScanQrIcon onScanBarcode={onScanBarcode} />
            )}
          </View>
        </View>

        <FlexSpacer />

        <AvaButton.PrimaryLarge
          disabled={!canSubmit}
          style={{margin: 16}}
          onPress={onNextPress}>
          Next
        </AvaButton.PrimaryLarge>

        {/*<Modal*/}
        {/*  animationType="slide"*/}
        {/*  transparent={true}*/}
        {/*  onRequestClose={() => setCameraVisible(false)}*/}
        {/*  visible={cameraVisible}>*/}
        {/*  <QrScannerAva*/}
        {/*    onSuccess={data => onBarcodeScanned(data)}*/}
        {/*    onCancel={() => setCameraVisible(false)}*/}
        {/*  />*/}
        {/*</Modal>*/}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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

export default SendForm;
