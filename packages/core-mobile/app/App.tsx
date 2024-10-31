import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native'
import RootScreenStack from 'navigation/RootScreenStack'
import { NavigationContainer, Route } from '@react-navigation/native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import 'utils/debugging/wdyr'
import { navigationRef } from 'utils/Navigation'
import SentryService from 'services/sentry/SentryService'
import {
  DdRumReactNavigationTracking,
  ViewNamePredicate
} from '@datadog/mobile-react-navigation'

const viewNamePredicate: ViewNamePredicate = (
  route: Route<string, any | undefined>,
  trackedName: string
) => {
  return `${route.name} ${trackedName}`
}

function App(): JSX.Element {
  const context = useApplicationContext()
  const [backgroundStyle] = useState(context.appBackgroundStyle)

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
            DdRumReactNavigationTracking.startTrackingViews(
              navigationRef.current,
              viewNamePredicate
            )
            SentryService.routingInstrumentation.registerNavigationContainer(
              navigationRef
            )
          }}>
          <RootScreenStack />
        </NavigationContainer>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default App
