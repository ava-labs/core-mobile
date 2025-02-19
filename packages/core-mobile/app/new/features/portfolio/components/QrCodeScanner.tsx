import React from 'react'
import QRCodeScanner from 'react-native-qrcode-scanner'
import { BarCodeReadEvent } from 'react-native-camera'
import { SxProp, View } from '@avalabs/k2-alpine'

type Props = {
  onSuccess: (data: BarCodeReadEvent) => void
  vibrate?: boolean
  sx?: SxProp
}

export const QrCodeScanner = ({
  onSuccess,
  sx,
  vibrate = false
}: Props): React.JSX.Element => {
  return (
    <View
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        ...sx
      }}>
      <QRCodeScanner
        cameraStyle={{ height: '100%' }}
        showMarker={true}
        markerStyle={[
          {
            borderColor: '#F7B500',
            borderRadius: 18,
            borderWidth: 6
          }
        ]}
        fadeIn={false}
        onRead={onSuccess}
        cameraType={'back'}
        vibrate={vibrate}
      />
    </View>
  )
}
