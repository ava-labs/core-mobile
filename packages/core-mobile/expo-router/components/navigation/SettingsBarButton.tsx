import { Text, TouchableOpacity } from 'react-native'
import React from 'react'

const SettingsBarButton = ({
  onPress
}: {
  onPress?: () => void
}): JSX.Element => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>Settings</Text>
    </TouchableOpacity>
  )
}

export default SettingsBarButton
