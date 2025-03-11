import { Icons, TouchableOpacity, useTheme } from '@avalabs/k2-alpine'
import React, { forwardRef } from 'react'
import { View as RNView } from 'react-native'

export const NotificationBarButton = forwardRef<RNView>(
  ({ onPress }: { onPress?: () => void }, ref): JSX.Element => {
    const { theme } = useTheme()

    return (
      <TouchableOpacity ref={ref} onPress={onPress}>
        <Icons.Social.Notifications color={theme.colors.$textPrimary} />
      </TouchableOpacity>
    )
  }
)
