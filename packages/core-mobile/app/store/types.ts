import { configureEncryptedStore } from 'store'
import {
  ListenerEffectAPI,
  TypedAddListener,
  TypedStartListening
} from '@reduxjs/toolkit'
import { rootReducer } from 'store'

type ConfiguredStore = ReturnType<typeof configureEncryptedStore>['store']
export type RawRootState = ReturnType<typeof rootReducer>
export type RootState = ReturnType<ConfiguredStore['getState']>
export type AppDispatch = ConfiguredStore['dispatch']
export type AppListenerEffectAPI = ListenerEffectAPI<RootState, AppDispatch>
export type ThunkApi = {
  state: RootState
  dispatch: AppDispatch
}

export type AppStartListening = TypedStartListening<RootState, AppDispatch>
export type AppAddListener = TypedAddListener<RootState, AppDispatch>
