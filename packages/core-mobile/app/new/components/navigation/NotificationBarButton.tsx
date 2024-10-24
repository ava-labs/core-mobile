import { Text, TouchableOpacity } from 'react-native'
import React from 'react'

const NotificationBarButton = ({
  onPress
}: {
  onPress?: () => void
}): JSX.Element => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>Notifications</Text>
    </TouchableOpacity>
  )
}

export default NotificationBarButton
