import React, { useEffect, useState, useCallback } from 'react'
import { Icons, SxProp, useTheme, View, Text, Button } from '@avalabs/k2-alpine'
import {
  BarcodeScanningResult,
  CameraView,
  PermissionStatus,
  useCameraPermissions
} from 'expo-camera'
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics'
import { Platform, Linking } from 'react-native'
import { check, PERMISSIONS, request } from 'react-native-permissions'
import Logger from 'utils/Logger'
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
  const [isPermissionGranted, setIsPermissionGranted] = useState(false)
  const [data, setData] = useState<string>()

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

  const checkIosPermission = useCallback(async () => {
    if (
      Platform.OS === 'ios' &&
      permission &&
      !permission.granted &&
      permission.canAskAgain
    ) {
      const permissionStatus = await requestPermission()
      setIsPermissionGranted(permissionStatus.granted === true)
    }
  }, [permission, requestPermission])

  useEffect(() => {
    checkIosPermission()
  }, [checkIosPermission])

  const checkAndroidPermission = useCallback(async () => {
    // on android, permission.canAskAgain returns false when user select "ask every time",
    // so we separate the logic for android
    if (Platform.OS === 'android') {
      const status = await check(PERMISSIONS.ANDROID.CAMERA).catch(Logger.error)
      if (status !== PermissionStatus.GRANTED) {
        const permissionStatus = await request(
          PERMISSIONS.ANDROID.CAMERA
        ).catch(Logger.error)
        setIsPermissionGranted(permissionStatus === PermissionStatus.GRANTED)
      }
    }
  }, [])

  useEffect(() => {
    checkAndroidPermission()
  }, [checkAndroidPermission])

  return isPermissionGranted === false ? (
    <>
      <View sx={{ gap: 12, marginBottom: 8 }}>
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
            To scan QR code from Core, your first need to allow camera
            permission in your device settings
          </Text>
        </View>
        <Button
          size="small"
          type="secondary"
          onPress={() => Linking.openSettings()}
          style={{ width: 165, marginLeft: 30 }}>
          Open device settings
        </Button>
      </View>
      <Loader
        sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
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
          height: '100%',
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
