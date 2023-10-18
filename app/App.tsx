import React, { createRef, useEffect, useState } from 'react'
import {
  KeyboardAvoidingView,
  LogBox,
  Platform,
  SafeAreaView,
  TextInput,
  UIManager
} from 'react-native'
import RootScreenStack from 'navigation/RootScreenStack'
import { NavigationContainer } from '@react-navigation/native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import useDevDebugging from 'utils/debugging/DevDebugging'
import 'utils/debugging/wdyr'
import { navigationRef } from 'utils/Navigation'
import SentryService from 'services/sentry/SentryService'
import Logger from 'utils/Logger'
import { Opacity50 } from 'resources/Constants'

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
  const { configure } = useDevDebugging()
  const isProduction = process.env.NODE_ENV === 'production'
  if (!isProduction) {
    configure()
  }

  const context = useApplicationContext()
  const [backgroundStyle] = useState(context.appBackgroundStyle)
  const textRef = createRef<TextInput>()

  useEffect(() => {
    Logger.showOnScreen(textRef.current)
  }, [textRef])

  return (
    <SafeAreaView style={backgroundStyle}>
      <KeyboardAvoidingView
        enabled={context.keyboardAvoidingViewEnabled}
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <NavigationContainer
          theme={context.navContainerTheme}
          ref={ref => {
            context.appNavHook.navigation.current = ref
            navigationRef.current = ref
          }}>
          <RootScreenStack />
        </NavigationContainer>
      </KeyboardAvoidingView>

      <TextInput
        ref={textRef}
        numberOfLines={10}
        editable={false}
        multiline={true}
        style={{
          position: 'absolute',
          top: 40,
          end: 0,
          color: 'white',
          width: 300,
          height: 50,
          backgroundColor: 'black' + Opacity50
        }}
      />
    </SafeAreaView>
  )
}
