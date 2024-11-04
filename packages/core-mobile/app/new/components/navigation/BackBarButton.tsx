import React from 'react'
import { Icons, View, useTheme } from '@avalabs/k2-alpine'

const BackBarButton = (): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View sx={{ padding: 16 }}>
      <Icons.Custom.BackArrowCustom color={theme.colors.$textPrimary} />
    </View>
  )
}

export default BackBarButton
