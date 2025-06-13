import { configureEncryptedStore } from 'store'
import {
  AnyAction,
  ListenerEffectAPI,
  ThunkDispatch,
  TypedAddListener,
  TypedStartListening
} from '@reduxjs/toolkit'
import { rootReducer } from 'store'

type ConfiguredStore = ReturnType<typeof configureEncryptedStore>['store']
export type RawRootState = ReturnType<typeof rootReducer>
export type RootState = ReturnType<ConfiguredStore['getState']>
export type AppDispatch = ConfiguredStore['dispatch']
export type AppThunkDispatch = ThunkDispatch<RootState, unknown, AnyAction>
export type AppListenerEffectAPI = ListenerEffectAPI<
  RootState,
  AppThunkDispatch
>
export type ThunkApi = {
  state: RootState
  dispatch: AppThunkDispatch
}

export type AppStartListening = TypedStartListening<RootState, AppDispatch>
export type AppAddListener = TypedAddListener<RootState, AppDispatch>
