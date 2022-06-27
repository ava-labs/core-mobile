import { isAnyOf } from '@reduxjs/toolkit'
import { differenceInSeconds } from 'date-fns'
import { AppState, AppStateStatus, Platform } from 'react-native'
import { AppListenerEffectAPI } from 'store'
import {
  onRehydrationComplete,
  setAppState,
  setIsLocked,
  setIsReady
} from 'store/app'
import { AppStartListening } from 'store/middleware/listener'
import { getNetworks } from 'store/network'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger, { LogLevel } from 'utils/Logger'
import {
  onAppLocked,
  onAppUnlocked,
  onBackground,
  onForeground,
  selectAppState
} from './slice'

const TIME_TO_LOCK_IN_SECONDS = 5

const init = async (action: any, listenerApi: AppListenerEffectAPI) => {
  const { dispatch, delay } = listenerApi

  Logger.setLevel(__DEV__ ? LogLevel.TRACE : LogLevel.ERROR)

  listenToAppState(listenerApi)

  dispatch(getNetworks())

  if (Platform.OS === 'android') BiometricsSDK.warmup()

  // artificially delay for 4.5s to allow splash screen's animation to finish
  await delay(4500)

  dispatch(setIsReady(true))
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

const lockApp = async (action: any, listenerApi: AppListenerEffectAPI) => {
  const { dispatch, condition } = listenerApi

  const backgroundStarted = new Date()

  await condition(isAnyOf(onForeground))

  const foregroundResumed = new Date()

  const secondsPassed = differenceInSeconds(
    foregroundResumed,
    backgroundStarted
  )

  // when app goes to background, lock the app after 5 seconds
  if (secondsPassed >= TIME_TO_LOCK_IN_SECONDS) {
    dispatch(setIsLocked(true))
    dispatch(onAppLocked())
  }
}

const setStateToUnlocked = async (
  action: any,
  listenerApi: AppListenerEffectAPI
) => {
  const dispatch = listenerApi.dispatch
  dispatch(setIsLocked(false))
}

export const addAppListeners = (startListening: AppStartListening) => {
  startListening({
    actionCreator: onRehydrationComplete,
    effect: init
  })

  startListening({
    actionCreator: onBackground,
    effect: lockApp
  })

  startListening({
    actionCreator: onAppUnlocked,
    effect: setStateToUnlocked
  })
}
