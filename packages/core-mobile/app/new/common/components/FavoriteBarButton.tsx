import { Icons, useTheme } from '@avalabs/k2-alpine'
import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import NavigationBarButton from './NavigationBarButton'

export const FavoriteBarButton = ({
  isFavorite,
  isModal,
  onPress,
  style
}: {
  isFavorite: boolean
  isModal?: boolean
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <NavigationBarButton onPress={onPress} isModal={isModal} style={style}>
      {isFavorite === true ? (
        <Icons.Toggle.StarFilled color={'#F7B500'} width={24} height={24} />
      ) : (
        <Icons.Toggle.StarOutline
          color={theme.colors.$textPrimary}
          width={24}
          height={24}
        />
      )}
    </NavigationBarButton>
  )
}
