import { Icons, TouchableOpacity, useTheme } from '@avalabs/k2-alpine'
import React from 'react'

export const FavoriteBarButton = ({
  isFavorite,
  onPress
}: {
  isFavorite: boolean
  onPress?: () => void
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <TouchableOpacity onPress={onPress}>
      {isFavorite === true ? (
        <Icons.Toggle.StarFilled color={theme.colors.$textPrimary} />
      ) : (
        <Icons.Toggle.StarOutline color={theme.colors.$textPrimary} />
      )}
    </TouchableOpacity>
  )
}
