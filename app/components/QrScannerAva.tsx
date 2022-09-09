import React from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'
import QRCodeScanner from 'react-native-qrcode-scanner'
import { BarCodeReadEvent } from 'react-native-camera'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaButton from './AvaButton'

type Props = {
  onSuccess: (data: string) => void
  onCancel?: () => void
  vibrate?: boolean
}

export default function QrScannerAva({
  onSuccess,
  onCancel,
  vibrate = false
}: Props) {
  const context = useApplicationContext()

  const handleSuccess = (e: BarCodeReadEvent): void => {
    onSuccess(e.data)
  }

  const theme = context.theme
  return (
    <SafeAreaView style={[context.backgroundStyle, styles.container]}>
      <QRCodeScanner
        showMarker={true}
        markerStyle={[
          {
            borderColor: theme.colorPrimary1,
            borderRadius: 8,
            shadowColor: theme.colorBg2,
            shadowOffset: { width: 4, height: 4 },
            shadowRadius: 8
          }
        ]}
        fadeIn={false}
        onRead={handleSuccess}
        cameraType={'back'}
        vibrate={vibrate}
      />
      {onCancel && (
        <AvaButton.PrimaryLarge onPress={onCancel} style={{ margin: 16 }}>
          Cancel
        </AvaButton.PrimaryLarge>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingStart: 0,
    paddingEnd: 0
  }
})
