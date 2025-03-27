import OldApp from 'ContextApp'
import NewApp from 'new/ContextApp'
import React, { useCallback, useState } from 'react'
import { Alert, View } from 'react-native'
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView
} from 'react-native-gesture-handler'
import { StorageKey } from 'resources/Constants'
import DeviceInfoService from 'services/deviceInfo/DeviceInfoService'
import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'
import { commonStorage } from 'utils/mmkv'

const bundleId = DeviceInfoService.getBundleId()
const isInternalBuild =
  bundleId === 'org.avalabs.avaxwallet.internal' ||
  bundleId === 'com.avaxwallet.internal'

const APP_SWITCH_NUMBER_OF_TOUCHES = 2

export const AppSwitcher = (): React.JSX.Element => {
  const [isNewApp, setIsNewApp] = useState<boolean>(
    commonStorage.getBoolean(StorageKey.K2_ALPINE) || true
  )

  const switchApp = useCallback(() => {
    const newValue = !isNewApp
    commonStorage.set(StorageKey.K2_ALPINE, newValue)
    setIsNewApp(newValue)
  }, [isNewApp, setIsNewApp])

  const pinchGesture = Gesture.Pinch()
    .runOnJS(true)
    .onStart(event => {
      if (event.numberOfPointers === APP_SWITCH_NUMBER_OF_TOUCHES) {
        Alert.alert('Switch App Experience?', '', [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          { text: 'OK', onPress: switchApp }
        ])
      }
    })

  const composedGestures = Gesture.Simultaneous(pinchGesture)

  // only allow switching to new app on internal builds
  if (!isInternalBuild && !__DEV__)
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <OldApp />
      </GestureHandlerRootView>
    )

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={composedGestures}>
        <View style={{ flex: 1, backgroundColor: '#000000' }}>
          {DevDebuggingConfig.K2_ALPINE || isNewApp ? <NewApp /> : <OldApp />}
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  )
}
