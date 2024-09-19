import React from 'react'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import StorybookUI from './.storybook'

SplashScreen.preventAutoHideAsync()

export default function RootLayout(): React.JSX.Element | null {
  const [loaded, error] = useFonts({
    'Aeonik-Bold': require('./src/assets/fonts/Aeonik-Bold.otf'),
    'Aeonik-Medium': require('./src/assets/fonts/Aeonik-Medium.otf'),
    DejaVuSansMono: require('./src/assets/fonts/DejaVuSansMono.ttf'),
    'Inter-Regular': require('./src/assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('./src/assets/fonts/Inter-SemiBold.ttf')
  })

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync()
    }
  }, [loaded, error])

  if (!loaded && !error) {
    return null
  }

  return <StorybookUI />
}
