import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Icons, SxProp, useTheme, View, Text } from '@avalabs/k2-alpine'
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions
} from 'expo-camera'
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics'
import { Platform } from 'react-native'
import { check, PERMISSIONS, request } from 'react-native-permissions'
import Logger from 'utils/Logger'
import { useFocusEffect } from '@react-navigation/native'
import { Loader } from './Loader'

type Props = {
  onSuccess: (data: string) => void
  vibrate?: boolean
  sx?: SxProp
}

export const QrCodeScanner = ({
  onSuccess,
  vibrate = false,
  sx
}: Props): React.JSX.Element | undefined => {
  const {
    theme: { colors }
  } = useTheme()
  const [permission, requestPermission] = useCameraPermissions()
  const [data, setData] = useState<string>()

  const shouldShowCamera = useMemo(() => {
    return permission?.granted === true
  }, [permission])

  const handleSuccess = (scanningResult: BarcodeScanningResult): void => {
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

  useFocusEffect(
    useCallback(() => {
      if (
        Platform.OS === 'ios' &&
        permission &&
        !permission.granted &&
        permission.canAskAgain
      ) {
        requestPermission()
      }
    }, [permission, requestPermission])
  )

  useFocusEffect(
    useCallback(() => {
      // on android, permission.canAskAgain returns false when user select "ask every time",
      // so we separate the logic for android
      if (Platform.OS === 'android') {
        check(PERMISSIONS.ANDROID.CAMERA)
          .then(result => {
            if (result !== 'granted') {
              request(PERMISSIONS.ANDROID.CAMERA)
            }
          })
          .catch(Logger.error)
      }
    }, [])
  )

  return !shouldShowCamera ? (
    <>
      <View
        sx={{
          flexDirection: 'row',
          gap: 10,
          alignItems: 'center',
          marginRight: 64,
          marginTop: 16
        }}>
        <Icons.Alert.ErrorOutline
          color={colors.$textDanger}
          width={20}
          height={20}
        />
        <Text variant="subtitle1" sx={{ color: '$textDanger' }}>
          To scan QR code from Core, your first need to allow camera permission
          in your device settings
        </Text>
      </View>
      <Loader />
    </>
  ) : (
    <View
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 18,
        overflow: 'hidden',
        ...sx
      }}>
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
        <Icons.Custom.CameraFrame />
      </View>
      (
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
        onBarcodeScanned={handleSuccess}
      />
      )
    </View>
  )
}
