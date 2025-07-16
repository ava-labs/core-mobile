import { Icons, useTheme } from '@avalabs/k2-alpine'
import React from 'react'
import { StyleProp } from 'react-native'
import { ViewStyle } from 'react-native'
import NavigationBarButton from './NavigationBarButton'

export const ShareBarButton = ({
  onPress,
  isModal,
  style
}: {
  onPress?: () => void
  isModal?: boolean
  style?: StyleProp<ViewStyle>
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <NavigationBarButton onPress={onPress} isModal={isModal} style={style}>
      <Icons.Social.ShareIOS color={theme.colors.$textPrimary} />
    </NavigationBarButton>
  )
}
