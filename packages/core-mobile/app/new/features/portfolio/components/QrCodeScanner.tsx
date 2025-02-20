import React, { useCallback, useRef } from 'react'
import { Icons, SxProp, View } from '@avalabs/k2-alpine'
import {
  useCameraDevice,
  useCodeScanner,
  Camera,
  type Code
} from 'react-native-vision-camera'
import { useIsFocused } from '@react-navigation/native'
import { hapticFeedback } from 'utils/HapticFeedback'

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
  const scannerEnabled = useRef(true)
  const device = useCameraDevice('back')
  const isFocused = useIsFocused()

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
      {device !== undefined ? (
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
          sx={{
            width: '100%',
            height: '100%',
            zIndex: 1,
            backgroundColor: '$textPrimary'
          }}
        />
      )}
    </View>
  )
}
