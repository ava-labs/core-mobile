import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import {BarCodeReadEvent} from 'react-native-camera';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaButton from './AvaButton';

type Props = {
  onSuccess: (data: string) => void;
  onCancel: () => void;
};

export default function QrScannerAva(props: Props | Readonly<Props>) {
  const context = useApplicationContext();

  const onSuccess = (e: BarCodeReadEvent): void => {
    props.onSuccess(e.data);
  };

  const theme = context.theme;
  return (
    <SafeAreaView style={[context.backgroundStyle, styles.container]}>
      <QRCodeScanner
        showMarker={true}
        markerStyle={[
          {
            borderColor: theme.accentColor,
            borderRadius: 8,
            shadowColor: theme.bgOnBgApp,
            shadowOffset: {width: 4, height: 4},
            shadowRadius: 8,
          },
        ]}
        fadeIn={false}
        onRead={e => onSuccess(e)}
        cameraType={'back'}
      />
      <AvaButton.PrimaryLarge onPress={props.onCancel} style={{margin: 16}}>
        Cancel
      </AvaButton.PrimaryLarge>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingStart: 0,
    paddingEnd: 0,
  },
});
