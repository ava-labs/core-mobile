import React, {useContext, useState} from 'react';
import {Modal, SafeAreaView, StyleSheet, View} from 'react-native';
import ButtonAva from 'components/ButtonAva';
import TextTitle from 'components/TextTitle';
import InputAmount from 'components/InputAmount';
import InputText from 'components/InputText';
import Loader from 'components/Loader';
import QrScannerAva from 'components/QrScannerAva';
import Header from 'screens/mainView/Header';
import ImgButtonAva from 'components/ImgButtonAva';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {useSendAvax} from 'screens/sendAvax/SendAvaxXHook';
import TextLabel from 'components/TextLabel';

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
    setSendAmountString,
    sendFeeString,
    onSendAvax,
    onScanBarcode,
    onBarcodeScanned,
    clearAddress,
  ] = useSendAvax(props.wallet);
  const [isDarkMode] = useState(context.isDarkMode);
  const [backgroundStyle] = useState(context.backgroundStyle);

  const ClearBtn = () => {
    const clearIcon = isDarkMode
      ? require('assets/icons/clear_dark.png')
      : require('assets/icons/clear_light.png');
    return (
      <View style={styles.clear}>
        <ImgButtonAva src={clearIcon} onPress={() => clearAddress()} />
      </View>
    );
  };

  const scanIcon = isDarkMode
    ? require('assets/icons/qr_scan_dark.png')
    : require('assets/icons/qr_scan_light.png');
  const clearBtn = address.length != 0 && ClearBtn();

  return (
    <SafeAreaView style={backgroundStyle}>
      <Header showBack onBack={props.onClose} />
      <TextTitle
        text={
          'Send AVAX ' + (targetChain ? ' (' + targetChain + ' Chain)' : '')
        }
      />
      <TextTitle text={'To:'} size={18} />

      <View style={styles.horizontalLayout}>
        <InputText
          style={[{flex: 1}]}
          multiline={true}
          onChangeText={text => setAddress(text)}
          value={address}
        />
        {clearBtn}
        <ImgButtonAva src={scanIcon} onPress={() => onScanBarcode()} />
      </View>

      <TextTitle text={'Amount:'} size={18} />
      <InputAmount
        showControls={true}
        onChangeText={text => setSendAmountString(text)}
      />
      <TextTitle text={'Fee:'} size={18} />
      <TextTitle text={sendFeeString + ' AVAX'} size={12} />

      <TextLabel text={errorMsg || ''} color={context.theme.error} />
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
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  clear: {
    position: 'absolute',
    end: 58,
  },
});
