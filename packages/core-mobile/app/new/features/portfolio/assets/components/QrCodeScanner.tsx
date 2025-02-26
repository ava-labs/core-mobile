import React from 'react'
import { Icons, SxProp, View } from '@avalabs/k2-alpine'
import QRCodeScanner from 'react-native-qrcode-scanner'
import { BarCodeReadEvent } from 'react-native-camera'

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
  const handleSuccess = (e: BarCodeReadEvent): void => {
    onSuccess(e.data)
  }

  return (
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
      <QRCodeScanner
        cameraStyle={{
          flex: 1
        }}
        showMarker={false}
        fadeIn={false}
        onRead={handleSuccess}
        cameraType={'back'}
        vibrate={vibrate}
      />
    </View>
  )
}
