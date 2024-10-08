import { Text, TouchableOpacity } from '@avalabs/k2-alpine'
import React from 'react'

const NotificationBarButton = ({
  onPress
}: {
  onPress: () => void
}): JSX.Element => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>Notifications</Text>
    </TouchableOpacity>
  )
}

export default NotificationBarButton
