import React, { useState, useEffect } from 'react'
import {
  KeyboardAvoidingView,
  LogBox,
  Platform,
  SafeAreaView,
  UIManager,
  InteractionManager
} from 'react-native'
import RootScreenStack from 'navigation/RootScreenStack'
import { NavigationContainer } from '@react-navigation/native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import useDevDebugging from 'utils/debugging/DevDebugging'
import 'utils/debugging/wdyr'
import { navigationRef } from 'utils/Navigation'
import SentryService from 'services/sentry/SentryService'
import DataDogService from 'services/datadog/DataDogService'
import Logger, { LogLevel } from 'utils/Logger'
import {
  hasMigratedFromAsyncStorage,
  migrateFromAsyncStorage
} from 'store/mmkv/ReduxStorage'
import Loader from 'components/Loader'

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

export default function App(): JSX.Element {
  const [hasMigrated, setHasMigrated] = useState(hasMigratedFromAsyncStorage)
  const { configure } = useDevDebugging()
  const isProduction = process.env.NODE_ENV === 'production'
  if (!isProduction) {
    configure()
  }

  const context = useApplicationContext()
  const [backgroundStyle] = useState(context.appBackgroundStyle)

  useEffect(() => {
    if (!hasMigratedFromAsyncStorage) {
      InteractionManager.runAfterInteractions(async () => {
        try {
          await migrateFromAsyncStorage()
          setHasMigrated(true)
        } catch (e) {
          // don't do anything if it fails
          // it will perform migration for the
          // remaining keys on the next app launch
        }
      })
    }
  }, [])

  return (
    <SafeAreaView style={backgroundStyle}>
      <KeyboardAvoidingView
        enabled={context.keyboardAvoidingViewEnabled}
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <NavigationContainer
          theme={context.navContainerTheme}
          ref={navigationRef}
          onReady={() => {
            DataDogService.init(navigationRef).catch(Logger.error)
          }}>
          {hasMigrated ? <RootScreenStack /> : <Loader />}
        </NavigationContainer>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
