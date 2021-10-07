import React, {FC, useContext} from 'react';
import {Modal, StyleSheet, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import InputText from 'components/InputText';
import QrScannerAva from 'components/QrScannerAva';
import {useSendAvaxRn} from 'screens/sendAvax/useSendAvaxRn';
import AvaButton from 'components/AvaButton';
import QRCode from 'components/svg/QRCode';
import {useNavigation} from '@react-navigation/native';

const ScanQrIcon = ({onScanBarcode}: {onScanBarcode: () => void}) => {
  return (
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
      <AvaButton.Icon onPress={onScanBarcode}>
        <QRCode />
      </AvaButton.Icon>
    </View>
  );
};

const AddCustomToken: FC = () => {
  const theme = useContext(ApplicationContext).theme;
  const {goBack} = useNavigation();
  const {
    errorMsg,
    cameraVisible,
    setCameraVisible,
    destinationAddress,
    setAddress,
    onScanBarcode,
    onBarcodeScanned,
  } = useSendAvaxRn();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        justifyContent: 'space-between',
      }}>
      <View style={styles.horizontalLayout}>
        <View style={[{flex: 1, paddingStart: 4, paddingEnd: 4}]}>
          <InputText
            label={'Address'}
            placeholder="Enter the address"
            multiline={true}
            errorText={destinationAddress.length === 0 ? undefined : errorMsg}
            onChangeText={text => setAddress(text)}
            value={destinationAddress}
            autoFocus
          />
        </View>
        {destinationAddress.length === 0 && (
          <ScanQrIcon onScanBarcode={onScanBarcode} />
        )}
      </View>

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

      <AvaButton.PrimaryLarge style={{margin: 16}} onPress={() => goBack()}>
        Add
      </AvaButton.PrimaryLarge>
    </View>
  );
};

const styles = StyleSheet.create({
  horizontalLayout: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default AddCustomToken;
