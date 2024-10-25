import React from 'react'
import { Text, View } from '@avalabs/k2-alpine'

const NotificationsScreen = (): JSX.Element => {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16
      }}>
      <Text variant="heading3">Notifications</Text>
    </View>
  )
}

export default NotificationsScreen
