import React from 'react'
import { Icons, View, useTheme } from '@avalabs/k2-alpine'
import { Platform } from 'react-native'

const BackBarButton = (): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View
      sx={{
        paddingLeft: Platform.OS === 'ios' ? 16 : 6,
        paddingRight: 16,
        paddingVertical: 16
      }}>
      <Icons.Custom.BackArrowCustom color={theme.colors.$textPrimary} />
    </View>
  )
}

export default BackBarButton
