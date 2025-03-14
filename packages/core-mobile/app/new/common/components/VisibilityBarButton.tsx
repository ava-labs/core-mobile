import { Icons, TouchableOpacity, useTheme } from '@avalabs/k2-alpine'
import React from 'react'

export const VisibilityBarButton = ({
  isVisible,
  onPress
}: {
  isVisible: boolean
  onPress?: () => void
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <TouchableOpacity onPress={onPress}>
      {isVisible === true ? (
        <Icons.Action.VisibilityOn
          color={theme.colors.$textPrimary}
          width={22}
          height={22}
        />
      ) : (
        <Icons.Action.VisibilityOff
          color={theme.colors.$textPrimary}
          width={22}
          height={22}
        />
      )}
    </TouchableOpacity>
  )
}
