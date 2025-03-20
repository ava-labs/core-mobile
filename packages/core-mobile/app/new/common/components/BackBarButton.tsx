import React from 'react'
import { Icons, Pressable, useTheme } from '@avalabs/k2-alpine'
import { Platform } from 'react-native'
import { router } from 'expo-router'

const BackBarButton = ({ onBack }: { onBack?: () => void }): JSX.Element => {
  const { theme } = useTheme()

  const handleBack = (): void => {
    onBack ? onBack() : router.back()
  }

  return (
    <Pressable
      onPress={handleBack}
      sx={{
        paddingLeft: Platform.OS === 'ios' ? 16 : 6,
        paddingRight: 16,
        paddingVertical: 16
      }}>
      <Icons.Custom.BackArrowCustom
        testID="header_back"
        color={theme.colors.$textPrimary}
      />
    </Pressable>
  )
}

export default BackBarButton
