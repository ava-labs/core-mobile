import { Icons, useTheme } from '@avalabs/k2-alpine'
import { router } from 'expo-router'
import React from 'react'
import NavigationBarButton from './NavigationBarButton'

const BackBarButton = ({
  onBack,
  isModal
}: {
  onBack?: () => void
  isModal?: boolean
}): JSX.Element => {
  const { theme } = useTheme()

  const handleBack = (): void => {
    onBack ? onBack() : router.back()
  }

  return (
    <NavigationBarButton
      isModal={isModal}
      testID="header_back"
      onPress={handleBack}>
      <Icons.Custom.BackArrowCustom color={theme.colors.$textPrimary} />
    </NavigationBarButton>
  )
}

export default BackBarButton
