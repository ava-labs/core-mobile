import { alpha, Icons, useTheme } from '@avalabs/k2-alpine'
import React from 'react'
import NavigationBarButton from './NavigationBarButton'

export const VisibilityBarButton = ({
  isPrivacyModeEnabled,
  isModal,
  onPress
}: {
  isPrivacyModeEnabled: boolean
  isModal?: boolean
  onPress?: () => void
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <NavigationBarButton testID="eye_icon" isModal={isModal} onPress={onPress}>
      {isPrivacyModeEnabled ? (
        <Icons.Action.VisibilityOff
          color={alpha(theme.colors.$textPrimary, 0.6)}
          width={24}
          height={24}
        />
      ) : (
        <Icons.Action.VisibilityOn
          color={theme.colors.$textPrimary}
          width={24}
          height={24}
        />
      )}
    </NavigationBarButton>
  )
}
