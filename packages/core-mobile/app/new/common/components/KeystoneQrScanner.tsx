import React, { useState, useCallback, useEffect } from 'react'
import { UR, URDecoder } from '@ngraveio/bc-ur'
import * as Progress from 'react-native-progress'
import { View, Text, SCREEN_WIDTH, useTheme } from '@avalabs/k2-alpine'
import { showKeystoneTroubleshooting } from 'features/keystone/utils'
import { QrCodeScanner } from './QrCodeScanner'
import { Space } from './Space'

const SCANNER_WIDTH = SCREEN_WIDTH - 64

interface Props {
  urTypes: string[]
  onSuccess: (ur: UR) => void
  onError?: () => void
  onCameraPermissionGranted?: (granted: boolean) => void
  info?: string
}

export const KeystoneQrScanner: (props: Props) => JSX.Element = ({
  info,
  urTypes,
  onSuccess,
  onError,
  onCameraPermissionGranted
}) => {
  const [urDecoder, setUrDecoder] = useState(new URDecoder())
  const [progress, setProgress] = useState<number>(0)
  const [showTroubleshooting, setShowTroubleshooting] = useState(false)
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false)
  const { theme } = useTheme()

  const progressColor = theme.isDark ? theme.colors.$white : theme.colors.$black
  const handleError = useCallback(() => {
    setUrDecoder(new URDecoder())
    setShowTroubleshooting(true)
    if (onError) {
      onError()
    }
  }, [onError])

  const showErrorSheet = useCallback(() => {
    showKeystoneTroubleshooting({
      errorCode: -1,
      retry: () => {
        setShowTroubleshooting(false)
        setProgress(0)
      }
    })
  }, [])

  useEffect(() => {
    if (showTroubleshooting && !onError) {
      showErrorSheet()
    }
  }, [showTroubleshooting, showErrorSheet, onError])

  useEffect(() => {
    if (onCameraPermissionGranted) {
      onCameraPermissionGranted(cameraPermissionGranted)
    }
  }, [cameraPermissionGranted, onCameraPermissionGranted])

  const handleScan = useCallback(
    (code: string) => {
      if (showTroubleshooting) {
        return
      }
      try {
        urDecoder.receivePart(code)
        if (!urDecoder.isComplete()) {
          setProgress(urDecoder.estimatedPercentComplete())
          return
        }

        if (urDecoder.isError()) {
          handleError()
        }

        if (urDecoder.isSuccess()) {
          const ur = urDecoder.resultUR()

          if (urTypes.includes(ur.type)) {
            setProgress(1)

            onSuccess(ur)

            setTimeout(() => {
              setUrDecoder(new URDecoder())
              setProgress(0)
            })
          } else {
            throw new Error('Invalid qr code')
          }
        }
      } catch (error) {
        handleError()
      }
    },
    [
      setProgress,
      onSuccess,
      urDecoder,
      urTypes,
      handleError,
      showTroubleshooting
    ]
  )

  return (
    <View sx={{ alignItems: 'center', height: '100%' }}>
      <QrCodeScanner
        paused={showTroubleshooting}
        onSuccess={handleScan}
        vibrate={progress !== 1}
        sx={{
          width: SCANNER_WIDTH,
          height: SCANNER_WIDTH
        }}
        onCameraPermissionGranted={setCameraPermissionGranted}
      />
      <View
        sx={{
          alignItems: 'center',
          flexDirection: 'column'
        }}>
        <Space y={cameraPermissionGranted ? 70 : SCANNER_WIDTH} />
        <Progress.Bar
          borderRadius={8}
          color={progressColor}
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
    </View>
  )
}
