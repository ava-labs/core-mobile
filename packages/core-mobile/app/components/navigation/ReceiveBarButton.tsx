import { Text, TouchableOpacity } from 'react-native'
import React from 'react'

const ReceiveBarButton = ({
  onPress
}: {
  onPress?: () => void
}): JSX.Element => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>QR Code</Text>
    </TouchableOpacity>
  )
}

export default ReceiveBarButton
