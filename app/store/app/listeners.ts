import AsyncStorage from '@react-native-async-storage/async-storage'
import { isAnyOf } from '@reduxjs/toolkit'
import { differenceInSeconds } from 'date-fns'
import { AppState, AppStateStatus, Platform } from 'react-native'
import { AppListenerEffectAPI } from 'store'
import {
  onRehydrationComplete,
  selectWalletState,
  setAppState,
  setIsLocked,
  setIsReady,
  setWalletState,
  WalletState
} from 'store/app'
import { AppStartListening } from 'store/middleware/listener'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger, { LogLevel } from 'utils/Logger'
import { extendAccountProps } from 'store/app/migrations'
import { capture } from 'store/posthog'
import DeviceInfo from 'react-native-device-info'
import {
  onAppLocked,
  onAppUnlocked,
  onBackground,
  onForeground,
  onLogOut,
  selectAppState,
  selectIsLocked
} from './slice'

const TIME_TO_LOCK_IN_SECONDS = 5

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const init = async (action: any, listenerApi: AppListenerEffectAPI) => {
  const { dispatch } = listenerApi

  Logger.setLevel(__DEV__ ? LogLevel.TRACE : LogLevel.ERROR)

  const fontScale = await DeviceInfo.getFontScale()
  dispatch(
    capture({
      event: 'ApplicationLaunched',
      properties: { FontScale: fontScale }
    })
  )
  dispatch(capture({ event: 'ApplicationOpened' }))
  listenToAppState(listenerApi)

  if (Platform.OS === 'android') {
    await BiometricsSDK.warmup()
  }
  dispatch(setIsReady(true))
}

const applyVersionMigrations = async (
  action: unknown,
  listenerApi: AppListenerEffectAPI
) => {
  extendAccountProps(listenerApi)
}

const listenToAppState = async (listenerApi: AppListenerEffectAPI) => {
  const dispatch = listenerApi.dispatch

  const handleAppStateChange = (
    currentAppState: AppStateStatus,
    nextAppState: AppStateStatus
  ) => {
    // if app state has changed
    if (nextAppState !== currentAppState) {
      // update cached state
      dispatch(setAppState(nextAppState))

      if (
        currentAppState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        Logger.info('app comes back to foreground')
        dispatch(capture({ event: 'ApplicationOpened' }))
        dispatch(onForeground())
      } else if (nextAppState === 'background') {
        Logger.info('app goes to background')
        dispatch(onBackground())
      }
    }
  }

  AppState.addEventListener('change', nextAppState => {
    const state = listenerApi.getState()
    const currentAppState = selectAppState(state)
    handleAppStateChange(currentAppState, nextAppState)
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lockApp = async (action: any, listenerApi: AppListenerEffectAPI) => {
  const { dispatch, condition } = listenerApi
  const state = listenerApi.getState()
  const walletState = selectWalletState(state)

  const isLocked = selectIsLocked(state)

  if (isLocked) {
    //bail out if already locked
    return
  }

  const backgroundStarted = new Date()

  await condition(isAnyOf(onForeground))

  const foregroundResumed = new Date()

  const secondsPassed = differenceInSeconds(
    foregroundResumed,
    backgroundStarted
  )

  // when app goes to background, lock the app after [TIME_TO_LOCK_IN_SECONDS] seconds
  if (secondsPassed >= TIME_TO_LOCK_IN_SECONDS) {
    dispatch(setIsLocked(true))
    dispatch(onAppLocked())
    if (walletState === WalletState.ACTIVE) {
      dispatch(setWalletState(WalletState.INACTIVE))
    }
  }
}

const setStateToUnlocked = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: any,
  listenerApi: AppListenerEffectAPI
) => {
  const dispatch = listenerApi.dispatch
  dispatch(setIsLocked(false))
  dispatch(setWalletState(WalletState.ACTIVE))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const clearData = async (action: any, listenerApi: AppListenerEffectAPI) => {
  const { dispatch } = listenerApi
  dispatch(setWalletState(WalletState.NONEXISTENT))
  await BiometricsSDK.clearWalletKey()
  await AsyncStorage.clear()
}

export const addAppListeners = (startListening: AppStartListening) => {
  startListening({
    actionCreator: onRehydrationComplete,
    effect: init
  })

  startListening({
    actionCreator: onAppUnlocked,
    effect: applyVersionMigrations
  })

  startListening({
    actionCreator: onBackground,
    effect: lockApp
  })

  startListening({
    actionCreator: onAppUnlocked,
    effect: setStateToUnlocked
  })

  startListening({
    actionCreator: onLogOut,
    effect: clearData
  })
}
