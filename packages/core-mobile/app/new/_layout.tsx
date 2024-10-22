import { useEffect } from 'react'
import 'react-native-reanimated'
import Bootsplash from 'react-native-bootsplash'

import React from 'react'
import { K2AlpineThemeProvider } from '@avalabs/k2-alpine'
import { Stack } from 'utils/navigation/Stack'

export default function RootLayout(): JSX.Element | null {
  useEffect(() => {
    Bootsplash.hide()
  }, [])

  return (
    <K2AlpineThemeProvider>
      <Stack screenOptions={{ headerShown: false, animationEnabled: false }}>
        <Stack.Screen name="(signedIn)" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </K2AlpineThemeProvider>
  )
}
