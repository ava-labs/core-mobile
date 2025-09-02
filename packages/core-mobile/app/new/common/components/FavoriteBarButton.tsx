import { Icons, useTheme } from '@avalabs/k2-alpine'
import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import NavigationBarButton from './NavigationBarButton'

export const FavoriteBarButton = ({
  isFavorite,
  onPress,
  style
}: {
  isFavorite: boolean
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <NavigationBarButton onPress={onPress} style={style}>
      {isFavorite === true ? (
        <Icons.Toggle.StarFilled
          testID="star_filled"
          color={'#F7B500'}
          width={24}
          height={24}
        />
      ) : (
        <Icons.Toggle.StarOutline
          testID="star_outline"
          color={theme.colors.$textPrimary}
          width={24}
          height={24}
        />
      )}
    </NavigationBarButton>
  )
}
