import { Icons, TouchableOpacity, useTheme } from '@avalabs/k2-alpine'
import React from 'react'

export const ShareBarButton = ({
  onPress
}: {
  onPress?: () => void
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <TouchableOpacity onPress={onPress}>
      <Icons.Social.ShareIOS color={theme.colors.$textPrimary} />
    </TouchableOpacity>
  )
}
