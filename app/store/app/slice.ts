import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppStateStatus } from 'react-native'
import { RootState } from 'store'
import { AppState } from './types'

const reducerName = 'app'

const initialState: AppState = {
  isReady: false,
  isLocked: true,
  appState: 'active'
}

export const appSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setIsReady: (state, action: PayloadAction<boolean>) => {
      state.isReady = action.payload
    },
    setIsLocked: (state, action: PayloadAction<boolean>) => {
      state.isLocked = action.payload
    },
    setAppState: (state, action: PayloadAction<AppStateStatus>) => {
      state.appState = action.payload
    }
  }
})

// selectors
export const selectIsReady = (state: RootState) => state.app.isReady

export const selectIsLocked = (state: RootState) => state.app.isLocked

export const selectAppState = (state: RootState) => state.app.appState

// actions
// when app rehydration is complete
export const onRehydrationComplete = createAction(
  `${reducerName}/onRehydrationComplete`
)
// todo: remove when no longer relying on wallet-react-components
export const onLegacyWalletStarted = createAction(
  `${reducerName}/onLegacyWalletStarted`
)

// when user has successfully entered pin or biometrics to unlock the app
export const onAppUnlocked = createAction(`${reducerName}/onAppUnlocked`)

// when app is locked and user is required to unlock to use app again
export const onAppLocked = createAction(`${reducerName}/onAppLocked`)

export const onBackground = createAction(`${reducerName}/onBackground`)

export const onForeground = createAction(`${reducerName}/onForeground`)

export const { setIsReady, setIsLocked, setAppState } = appSlice.actions

export const appReducer = appSlice.reducer
