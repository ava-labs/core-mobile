import React, { useEffect, useState } from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions
} from 'expo-camera'
import { View } from 'react-native'
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics'
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
}: Props): JSX.Element {
  const { theme, backgroundStyle } = useApplicationContext()
  const [permission, requestPermission] = useCameraPermissions()
  const [data, setData] = useState<string>()

  const handleScanned = (scanningResult: BarcodeScanningResult): void => {
    // expo-camera's onBarcodeScanned callback is not debounced, so we need to debounce it ourselves
    setData(scanningResult.data)
  }

  useEffect(() => {
    if (data) {
      onSuccess(data)

      if (vibrate) {
        notificationAsync(NotificationFeedbackType.Success)
      }
    }
  }, [data, onSuccess, vibrate])

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission()
    }
  }, [permission, requestPermission])

  return (
    <SafeAreaView style={[backgroundStyle, styles.container]}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <CameraView
          style={{
            width: '100%',
            aspectRatio: 1,
            justifyContent: 'center',
            alignItems: 'center'
          }}
          ratio="1:1"
          barcodeScannerSettings={{
            barcodeTypes: ['qr']
          }}
          onBarcodeScanned={handleScanned}>
          <View
            style={{
              padding: 80,
              backgroundColor: 'transparent'
            }}>
            <View
              style={{
                width: '100%',
                aspectRatio: 1,
                borderRadius: 8,
                borderColor: theme.colorPrimary1,
                borderWidth: 4
              }}
            />
          </View>
        </CameraView>
      </View>
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
