import { Icons, useTheme } from '@avalabs/k2-alpine'
import { router } from 'expo-router'
import React from 'react'
import { Keyboard } from 'react-native'
import NavigationBarButton from './NavigationBarButton'

const BackBarButton = ({ onBack }: { onBack?: () => void }): JSX.Element => {
  const { theme } = useTheme()

  const handleBack = (): void => {
    if (Keyboard.isVisible()) Keyboard.dismiss()
    onBack ? onBack() : router.back()
  }

  return (
    <NavigationBarButton isLeft testID="header_back" onPress={handleBack}>
      <Icons.Custom.BackArrowCustom color={theme.colors.$textPrimary} />
    </NavigationBarButton>
  )
}

export default BackBarButton
