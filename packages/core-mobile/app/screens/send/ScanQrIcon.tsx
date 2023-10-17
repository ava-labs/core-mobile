import React from 'react'
import { Platform, View } from 'react-native'
import AvaButton from 'components/AvaButton'
import QRCode from 'components/svg/QRCodeSVG'

export const ScanQrIcon = ({
  onScanBarcode
}: {
  onScanBarcode: () => void
}) => {
  return (
    <View
      style={[
        {
          position: 'absolute',
          right: 0,
          marginRight: 20,
          top: 0,
          marginTop: Platform.OS === 'ios' ? 34 : 40
        }
      ]}>
      <AvaButton.Icon onPress={onScanBarcode}>
        <QRCode />
      </AvaButton.Icon>
    </View>
  )
}
