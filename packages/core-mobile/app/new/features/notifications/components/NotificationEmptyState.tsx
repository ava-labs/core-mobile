import React, { FC } from 'react'
import { Text, View } from '@avalabs/k2-alpine'

const NotificationEmptyState: FC = () => {
  return (
    <View
      sx={{
        alignItems: 'center',
        paddingHorizontal: 32
      }}>
      <Text
        sx={{
          fontSize: 48,
          lineHeight: 60,
          marginBottom: 16
        }}>
        🙌
      </Text>
      <Text
        variant="heading6"
        sx={{
          color: '$textPrimary',
          textAlign: 'center',
          marginBottom: 8
        }}>
        No notifications
      </Text>
      <Text
        variant="body2"
        sx={{
          color: '$textSecondary',
          textAlign: 'center'
        }}>
        You're all caught up
      </Text>
    </View>
  )
}

export default NotificationEmptyState
