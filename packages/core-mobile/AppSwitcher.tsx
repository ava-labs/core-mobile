import React, { useState, useCallback, useMemo } from 'react'
import { Alert, View, PanResponder } from 'react-native'
import OldApp from 'ContextApp'
import NewApp from 'new/ContextApp'
import { commonStorage } from 'utils/mmkv'
import { StorageKey } from 'resources/Constants'
import DeviceInfoService from 'services/deviceInfo/DeviceInfoService'
import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'

const bundleId = DeviceInfoService.getBundleId()
const isInternalBuild =
  bundleId === 'org.avalabs.avaxwallet.internal' ||
  bundleId === 'com.avaxwallet.internal'

export const AppSwitcher = (): React.JSX.Element => {
  const [isNewApp, setIsNewApp] = useState(
    commonStorage.getBoolean(StorageKey.K2_ALPINE)
  )

  const switchApp = useCallback(() => {
    const newValue = !isNewApp
    commonStorage.set(StorageKey.K2_ALPINE, newValue)
    setIsNewApp(newValue)
  }, [isNewApp, setIsNewApp])

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (evt, gestureState) => {
          if (gestureState.numberActiveTouches === 2) {
            Alert.alert('Switch App Experience?', '', [
              {
                text: 'Cancel',
                style: 'cancel'
              },
              { text: 'OK', onPress: switchApp }
            ])
          }

          return true
        }
      }),
    [switchApp]
  )

  // only allow switching to new app on internal builds
  if (!isInternalBuild) return <OldApp />

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {DevDebuggingConfig.K2_ALPINE || isNewApp ? <NewApp /> : <OldApp />}
    </View>
  )
}
