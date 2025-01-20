import React, { useState, useCallback } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { UR, URDecoder } from '@keystonehq/keystone-sdk'
import * as Progress from 'react-native-progress'
import { View, Text } from '@avalabs/k2-mobile'
import QRCodeScanner from 'react-native-qrcode-scanner'
import { BarCodeReadEvent } from 'react-native-camera'
import { Space } from './Space'

interface Props {
  urType: string
  onSuccess: (ur: UR) => void
  onError: (errorInfo: { title: string; message: string }) => void
  info?: string
}

export const KeystoneQrScannerAva: (props: Props) => JSX.Element = ({
  info,
  urType,
  onSuccess,
  onError
}) => {
  const [urDecoder, setUrDecoder] = useState(new URDecoder())
  const [progress, setProgress] = useState(0)
  const { theme } = useApplicationContext()

  const handleError = useCallback(() => {
    onError({
      title: 'Invalid qr code',
      message:
        'Please ensure you have selected a valid QR code from your Keystone device.'
    })
    setUrDecoder(new URDecoder())
  }, [onError])

  const handleScan = useCallback(
    (code: string) => {
      try {
        urDecoder.receivePart(code)
        if (!urDecoder.isComplete()) {
          !!progress &&
            setProgress(Math.trunc(urDecoder.estimatedPercentComplete()))
          return
        }

        if (urDecoder.isError()) {
          handleError()
        }

        if (urDecoder.isSuccess()) {
          const ur = urDecoder.resultUR()

          if (ur.type.toLowerCase() === urType.toLowerCase()) {
            !!setProgress && setProgress(1)

            onSuccess(ur)
          } else {
            throw new Error('Invalid qr code')
          }
        }
      } catch (error) {
        handleError()
      }
    },
    [setProgress, onSuccess, progress, urDecoder, urType, handleError]
  )

  return (
    <View sx={{ alignItems: 'center' }}>
      <QRCodeScanner
        cameraContainerStyle={{ alignItems: 'center' }}
        cameraStyle={{ height: 320, width: 320 }}
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
        onRead={(e: BarCodeReadEvent) => {
          handleScan(e.data)
        }}
        cameraType={'back'}
        vibrate={progress !== 1}
        reactivate
        bottomContent={
          <View
            sx={{
              alignItems: 'center',
              flexDirection: 'column'
            }}>
            <Space y={70} />
            <Progress.Bar
              borderRadius={8}
              color={theme.white}
              width={290}
              height={16}
              progress={progress}
              style={{
                opacity: [0, 1].includes(progress) ? 0 : 1
              }}
            />
            {info && (
              <>
                <Space y={32} />
                <Text>{info}</Text>
              </>
            )}
          </View>
        }
      />
    </View>
  )
}
