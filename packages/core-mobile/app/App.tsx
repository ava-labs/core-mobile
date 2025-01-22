import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native'
import RootScreenStack from 'navigation/RootScreenStack'
import { NavigationContainer } from '@react-navigation/native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import 'utils/debugging/wdyr'
import { navigationRef } from 'utils/Navigation'
import SentryService from 'services/sentry/SentryService'
import DataDogService from 'services/datadog/DataDogService'
import Logger from 'utils/Logger'
import { DatadogProvider } from '@datadog/mobile-react-native'
import { getDatadogConfig } from 'services/datadog/DataDogConfig'

function App(): JSX.Element {
  const context = useApplicationContext()
  const [backgroundStyle] = useState(context.appBackgroundStyle)

  console.log(getDatadogConfig())

  return (
    <DatadogProvider configuration={getDatadogConfig()}>
      <SafeAreaView style={backgroundStyle}>
        <KeyboardAvoidingView
          enabled={context.keyboardAvoidingViewEnabled}
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <NavigationContainer
            theme={context.navContainerTheme}
            ref={navigationRef}
            onReady={() => {
              SentryService.routingInstrumentation.registerNavigationContainer(
                navigationRef
              )
              DataDogService.init(navigationRef).catch(Logger.error)
            }}>
            <RootScreenStack />
          </NavigationContainer>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </DatadogProvider>
  )
}

export default App
