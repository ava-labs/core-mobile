import { useTheme } from '@avalabs/k2-alpine'
import { Stack } from 'common/components/Stack'
import { stackScreensOptions } from 'common/consts/screenOptions'
import React from 'react'

export default function WalletsLayout(): JSX.Element {
  const {
    theme: { isDark }
  } = useTheme()

  return (
    <Stack
      screenOptions={{
        ...stackScreensOptions,
        // Paint the native screen background (behind the RN content) to match
        // the WalletsScreen list background, so the default color doesn't flash
        // during the push transition or on overscroll. `ListScreenV2`'s own
        // `backgroundColor` only covers the list, not the route container.
        contentStyle: {
          backgroundColor: isDark ? '#121213' : '#F1F1F4'
        }
      }}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
