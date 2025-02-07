import { Icons, TouchableOpacity, useTheme } from '@avalabs/k2-alpine'
import React from 'react'

export const NotificationBarButton = ({
  onPress
}: {
  onPress?: () => void
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <TouchableOpacity onPress={onPress}>
      <Icons.Social.Notifications color={theme.colors.$textPrimary} />
    </TouchableOpacity>
  )
}
