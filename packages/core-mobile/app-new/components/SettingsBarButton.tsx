import { Text, TouchableOpacity } from '@avalabs/k2-alpine'
import React from 'react'

const SettingsHeaderButton = ({
  onPress
}: {
  onPress: () => void
}): JSX.Element => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>Settings</Text>
    </TouchableOpacity>
  )
}

export default SettingsHeaderButton
