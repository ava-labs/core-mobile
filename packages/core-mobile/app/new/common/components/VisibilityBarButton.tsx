import { alpha, Icons, TouchableOpacity, useTheme } from '@avalabs/k2-alpine'
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
    <TouchableOpacity onPress={onPress} hitSlop={16}>
      {isPrivacyModeEnabled ? (
        <Icons.Action.VisibilityOff
          testID="eye_icon"
          color={alpha(theme.colors.$textPrimary, 0.6)}
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
