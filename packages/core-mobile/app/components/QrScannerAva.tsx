import React, { useCallback, useEffect, useRef } from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import {
  Camera,
  Code,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner
} from 'react-native-vision-camera'
import { useIsFocused } from '@react-navigation/native'
import { View } from '@avalabs/k2-mobile'
import { hapticFeedback } from 'utils/HapticFeedback'
import AvaButton from './AvaButton'

type Props = {
  onSuccess: (data: string) => void
  onCancel?: () => void
  vibrate?: boolean
}

export default function QrScannerAva({
  onSuccess,
  onCancel,
  vibrate
}: Props): JSX.Element | undefined {
  const context = useApplicationContext()
  const theme = context.theme

  const scannerEnabled = useRef(true)
  const device = useCameraDevice('back')
  const isFocused = useIsFocused()
  const { hasPermission, requestPermission } = useCameraPermission()

  useEffect(() => {
    if (!hasPermission) {
      requestPermission()
    }
  }, [hasPermission, requestPermission])

  const onCodeScanned = useCallback(
    (codes: Code[]) => {
      const data = codes[0]?.value
      if (data === undefined || scannerEnabled.current === false) return
      scannerEnabled.current = false
      onSuccess(data)
      vibrate && hapticFeedback()
    },
    [onSuccess, vibrate]
  )

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned
  })

  return (
    <SafeAreaView style={[context.backgroundStyle, styles.container]}>
      <View
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <View
          style={{
            width: 200,
            height: 200,
            borderColor: theme.colorPrimary1,
            borderWidth: 3,
            borderRadius: 8,
            shadowRadius: 8,
            shadowColor: theme.colorBg2,
            shadowOffset: { width: 4, height: 4 }
          }}
        />
      </View>
      {device !== undefined && hasPermission ? (
        <Camera
          style={{
            width: '100%',
            height: '100%',
            zIndex: 1
          }}
          device={device}
          isActive={isFocused}
          codeScanner={codeScanner}
        />
      ) : (
        <View
          style={{
            width: '100%',
            height: '100%',
            zIndex: 1
          }}
        />
      )}
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
