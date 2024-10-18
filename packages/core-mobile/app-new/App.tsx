import React, { useMemo } from 'react'
import { KeyboardAvoidingView, LogBox, Platform, UIManager } from 'react-native'
import * as Sentry from '@sentry/react-native'
import { NavigationContainer } from '@react-navigation/native'
import type { Theme } from '@react-navigation/native'
import useDevDebugging from 'utils/debugging/DevDebugging'
import 'utils/debugging/wdyr'
import { navigationRef } from 'utils/Navigation'
import SentryService from 'services/sentry/SentryService'
import DataDogService from 'services/datadog/DataDogService'
import Logger, { LogLevel } from 'utils/Logger'
import { useTheme } from '@avalabs/k2-alpine'
import RootStack from './navigation-new/RootStack'

Logger.setLevel(__DEV__ ? LogLevel.TRACE : LogLevel.ERROR)

LogBox.ignoreLogs([
  'Require cycle:',
  "Can't perform",
  'new',
  'Non-serializable'
])

SentryService.init()

Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(false)

function App(): JSX.Element {
  const { configure } = useDevDebugging()
  const isProduction = process.env.NODE_ENV === 'production'
  if (!isProduction) {
    configure()
  }

  const { theme } = useTheme()

  const isDarkMode = true // useState(Appearance.getColorScheme() === 'dark');
  const navContainerTheme = useMemo(() => {
    return {
      dark: isDarkMode,
      colors: {
        primary: theme.colors.$textPrimary,
        background: theme.colors.$surfacePrimary,
        text: theme.colors.$textPrimary,
        card: theme.colors.$surfacePrimary,
        border: theme.colors.$borderPrimary,
        notification: theme.colors.$textPrimary
      }
    } as Theme
  }, [isDarkMode, theme])

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <NavigationContainer
        theme={navContainerTheme}
        ref={navigationRef}
        onReady={() => {
          SentryService.routingInstrumentation.registerNavigationContainer(
            navigationRef
          )
          DataDogService.init(navigationRef).catch(Logger.error)
        }}>
        <RootStack />
      </NavigationContainer>
    </KeyboardAvoidingView>
  )
}

export default Sentry.wrap(App)
