import { Text, TouchableOpacity } from '@avalabs/k2-alpine'
import React from 'react'

const ReceiveBarButton = ({
  onPress
}: {
  onPress: () => void
}): JSX.Element => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>QR Code</Text>
    </TouchableOpacity>
  )
}

export default ReceiveBarButton
