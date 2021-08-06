import React, {useState} from 'react';
import {Appearance, SafeAreaView, StyleSheet} from 'react-native';
import CommonViewModel from 'utils/CommonViewModel';
import QRCodeScanner from 'react-native-qrcode-scanner';
import {BarCodeReadEvent} from 'react-native-camera';
import {COLORS, COLORS_NIGHT} from '../resources/Constants';
import ButtonAva from './ButtonAva';

type Props = {
  onSuccess: (data: string) => void;
  onCancel: () => void;
};

export default function QrScannerAva(props: Props | Readonly<Props>) {
  const [commonViewModel] = useState(
    new CommonViewModel(Appearance.getColorScheme()),
  );
  const [isDarkMode] = useState(commonViewModel.isDarkMode);
  const [backgroundStyle] = useState(commonViewModel.backgroundStyle);

  const onSuccess = (e: BarCodeReadEvent): void => {
    props.onSuccess(e.data);
  };

  const theme = isDarkMode ? COLORS_NIGHT : COLORS;
  return (
    <SafeAreaView style={[backgroundStyle, styles.container]}>
      <QRCodeScanner
        showMarker={true}
        markerStyle={[
          {
            borderColor: theme.primaryColor,
            borderRadius: 8,
            shadowColor: theme.onPrimary,
            shadowOffset: {width: 4, height: 4},
            shadowRadius: 8,
          },
        ]}
        fadeIn={false}
        onRead={e => onSuccess(e)}
        cameraType={'back'}
      />
      <ButtonAva text={'Cancel'} onPress={() => props.onCancel()} />
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
