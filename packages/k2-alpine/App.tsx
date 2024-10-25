import React from 'react'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import StorybookUI from './.storybook'
import { K2AlpineThemeProvider } from './src'

SplashScreen.preventAutoHideAsync()

export default function RootLayout(): React.JSX.Element | null {
  const [loaded, error] = useFonts({
    'Aeonik-Bold': require('./src/assets/fonts/Aeonik-Bold.otf'),
    'Aeonik-Medium': require('./src/assets/fonts/Aeonik-Medium.otf'),
    DejaVuSansMono: require('./src/assets/fonts/DejaVuSansMono.ttf'),
    'Inter-Regular': require('./src/assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('./src/assets/fonts/Inter-SemiBold.ttf')
  })
  const colorScheme = useColorScheme()

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync()
    }
  }, [loaded, error])

  if (!loaded && !error) {
    return null
  }

  return (
    <K2AlpineThemeProvider colorScheme={colorScheme}>
      <StorybookUI />
    </K2AlpineThemeProvider>
  )
}
