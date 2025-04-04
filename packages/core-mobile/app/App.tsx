import React, { useCallback, useState } from 'react'
import { KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native'
import RootScreenStack from 'navigation/RootScreenStack'
import { NavigationContainer } from '@react-navigation/native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import 'utils/debugging/wdyr'
import { navigationRef } from 'utils/Navigation'
import SentryService from 'services/sentry/SentryService'
// TODO: renable DataDogService after datadog 2.6.5 is released
// import DataDogService from 'services/datadog/DataDogService'

const BROWSER_TAB_ROUTE_NAME = 'BrowserScreens.TabView'

function App(): JSX.Element {
  const context = useApplicationContext()
  const [backgroundStyle] = useState(context.appBackgroundStyle)
  const routeNameRef = React.useRef<string>()

  const handleNavigationStateChange = useCallback(() => {
    const previousRouteName = routeNameRef.current
    const currentRouteName = navigationRef?.current?.getCurrentRoute?.()?.name

    if (previousRouteName !== currentRouteName) {
      // Save the current route name for later comparison
      routeNameRef.current = currentRouteName
    }
  }, [])

  const handleNavigationReady = useCallback(() => {
    routeNameRef.current = navigationRef.current?.getCurrentRoute?.()?.name
    SentryService.navigationIntegration.registerNavigationContainer(
      navigationRef
    )
    // DataDogService.init(navigationRef).catch(Logger.error)
  }, [])

  // only enable the keyboard avoiding view when we are not in the browser tab
  // reason: we don't want the webview's content to be pushed up when the keyboard is shown
  // this prevents issues such as "In-app browser cutting off token search bar in LFJ"
  // https://ava-labs.atlassian.net/browse/CP-9750
  const shouldEnableKeyboardAvoidingView =
    routeNameRef.current !== BROWSER_TAB_ROUTE_NAME

  return (
    <SafeAreaView style={backgroundStyle}>
      <KeyboardAvoidingView
        enabled={shouldEnableKeyboardAvoidingView}
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <NavigationContainer
          navigationInChildEnabled
          theme={context.navContainerTheme}
          ref={navigationRef}
          onStateChange={handleNavigationStateChange}
          onReady={handleNavigationReady}>
          <RootScreenStack />
        </NavigationContainer>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default App
