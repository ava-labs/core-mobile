import React from 'react'
import { Icons, View, useTheme } from '@avalabs/k2-alpine'

const BackBarButton = (): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View sx={{ padding: 16 }}>
      {/* todo: please remove the ts-expect-error comments after we address this issue
        https://ava-labs.atlassian.net/browse/CP-9297
        @ts-expect-error */}
      <Icons.Custom.BackArrowCustom color={theme.colors.$textPrimary} />
    </View>
  )
}

export default BackBarButton
