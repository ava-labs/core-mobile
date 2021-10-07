import React, {FC, useContext} from 'react';
import {Modal, StyleSheet, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import InputText from 'components/InputText';
import QrScannerAva from 'components/QrScannerAva';
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
            errorText={'awaiting implementation'}
            onChangeText={text => {}}
            value={'awaiting implementation'}
            autoFocus
          />
        </View>
        {/*{destinationAddress.length === 0 && (*/}
        {/*  <ScanQrIcon onScanBarcode={onScanBarcode} />*/}
        {/*)}*/}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        onRequestClose={() => {}}
        visible={false}>
        <QrScannerAva
          onSuccess={data => {}}
          onCancel={() => {}}
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
