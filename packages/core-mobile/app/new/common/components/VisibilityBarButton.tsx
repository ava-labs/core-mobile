import { Icons, TouchableOpacity, useTheme } from '@avalabs/k2-alpine'
import React from 'react'

export const VisibilityBarButton = ({
  isPrivacyModeEnabled,
  onPress
}: {
  isPrivacyModeEnabled: boolean
  onPress?: () => void
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <TouchableOpacity onPress={onPress}>
      {isPrivacyModeEnabled ? (
        <Icons.Action.VisibilityOff
          testID="eye_icon"
          color={theme.colors.$textPrimary}
          width={22}
          height={22}
        />
      ) : (
        <Icons.Action.VisibilityOn
          color={theme.colors.$textPrimary}
          width={22}
          height={22}
        />
      )}
    </TouchableOpacity>
  )
}
