import { Action, isAnyOf } from '@reduxjs/toolkit'
import { differenceInSeconds } from 'date-fns'
import { AppState, AppStateStatus, Platform } from 'react-native'
import { AppListenerEffectAPI } from 'store'
import {
  immediateAppLock,
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
import Logger from 'utils/Logger'
import DeviceInfo from 'react-native-device-info'
import { WalletType } from 'services/wallet/types'
import SecureStorageService from 'security/SecureStorageService'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { MMKVStorage } from 'store/MMKVStorage'
import {
  onAppLocked,
  onAppUnlocked,
  onBackground,
  onForeground,
  onLogOut,
  selectAppState,
  selectIsLocked,
  setWalletType
} from './slice'

const TIME_TO_LOCK_IN_SECONDS = 5

const init = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { dispatch } = listenerApi
  const state = listenerApi.getState()

  // check wallet state during app launch, if it's active, reset it to inactive
  const isWalletActive = selectWalletState(state) === WalletState.ACTIVE
  isWalletActive && dispatch(setWalletState(WalletState.INACTIVE))

  const fontScale = await DeviceInfo.getFontScale()
  AnalyticsService.capture('ApplicationLaunched', { FontScale: fontScale })
  AnalyticsService.capture('ApplicationOpened')
  listenToAppState(listenerApi)

  if (Platform.OS === 'android') {
    await BiometricsSDK.warmup()
  }
  dispatch(setIsReady(true))
}

const listenToAppState = async (
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const dispatch = listenerApi.dispatch

  const handleAppStateChange = (
    currentAppState: AppStateStatus,
    nextAppState: AppStateStatus
  ): void => {
    // if app state has changed
    if (nextAppState !== currentAppState) {
      // update cached state
      dispatch(setAppState(nextAppState))

      if (
        currentAppState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        Logger.info('app comes back to foreground')
        AnalyticsService.capture('ApplicationOpened')
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

const lockApp = async (
  action: Action,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { dispatch, condition } = listenerApi
  const state = listenerApi.getState()
  const walletState = selectWalletState(state)

  const isLocked = selectIsLocked(state)

  if (isLocked) {
    //bail out if already locked
    return
  }

  const lockTheApp = (): void => {
    dispatch(setIsLocked(true))
    dispatch(onAppLocked())
    if (walletState === WalletState.ACTIVE) {
      dispatch(setWalletState(WalletState.INACTIVE))
    }
  }

  if (action.type === immediateAppLock.type) {
    lockTheApp()
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
  const isTimeManipulated = secondsPassed < 0
  if (isTimeManipulated || secondsPassed >= TIME_TO_LOCK_IN_SECONDS) {
    lockTheApp()
  }
}

const setStateToUnlocked = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const dispatch = listenerApi.dispatch
  dispatch(setIsLocked(false))
  dispatch(setWalletState(WalletState.ACTIVE))
}

const clearData = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { dispatch } = listenerApi
  dispatch(setWalletState(WalletState.NONEXISTENT))
  dispatch(setWalletType(WalletType.UNSET))
  await BiometricsSDK.clearAllWalletKeys().catch(e =>
    Logger.error('failed to clear biometrics', e)
  )
  await SecureStorageService.clearAll().catch(e =>
    Logger.error('failed to clear secure store', e)
  )
  await MMKVStorage.clear().catch(e =>
    Logger.error('failed to clear async store', e)
  )
}

export const addAppListeners = (startListening: AppStartListening): void => {
  startListening({
    actionCreator: onRehydrationComplete,
    effect: init
  })

  startListening({
    matcher: isAnyOf(onBackground, immediateAppLock),
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
