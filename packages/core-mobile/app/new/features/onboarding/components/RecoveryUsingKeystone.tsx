import React, { useState } from 'react'
import { View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { UR, URType } from '@keystonehq/keystone-sdk'
import { KeystoneQrScanner } from 'common/components/KeystoneQrScanner'

export const RecoveryUsingKeystone = ({
  onSuccess,
  onError
}: {
  onSuccess: (ur: UR) => void
  onError: () => void
}): JSX.Element => {
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false)

  return (
    <ScrollScreen
      showNavigationHeaderTitle={false}
      title="Scan the QR code"
      contentContainerStyle={{
        padding: 16
      }}>
      <View sx={{ gap: 20, marginTop: cameraPermissionGranted ? 100 : 0 }}>
        <KeystoneQrScanner
          urTypes={[URType.CryptoMultiAccounts]}
          onSuccess={onSuccess}
          onError={onError}
          onCameraPermissionGranted={setCameraPermissionGranted}
          info="Place the QR code from your Keystone device in front of the camera."
        />
      </View>
    </ScrollScreen>
  )
}
