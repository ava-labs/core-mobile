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

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (evt, gestureState) => {
          return (
            gestureState.numberActiveTouches === APP_SWITCH_NUMBER_OF_TOUCHES
          )
        },
        onPanResponderGrant: (evt, gestureState) => {
          if (
            gestureState.numberActiveTouches === APP_SWITCH_NUMBER_OF_TOUCHES
          ) {
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
  if (!isInternalBuild && !__DEV__) return <OldApp />

  return (
    <View
      style={{ flex: 1, backgroundColor: '#000000' }}
      {...panResponder.panHandlers}>
      {DevDebuggingConfig.K2_ALPINE || isNewApp ? <NewApp /> : <OldApp />}
    </View>
  )
}
