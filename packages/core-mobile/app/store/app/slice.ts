import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppStateStatus } from 'react-native'
import { RootState } from 'store/types'
import { WalletType } from 'services/wallet/types'
import { AppState, WalletState } from './types'

export const reducerName = 'app'

export const initialState: AppState = {
  isReady: false,
  isLocked: true,
  isIdled: false,
  appState: 'active',
  walletState: WalletState.NONEXISTENT,
  walletType: WalletType.UNSET
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
    setIsIdled: (state, action: PayloadAction<boolean>) => {
      state.isIdled = action.payload
    },
    setAppState: (state, action: PayloadAction<AppStateStatus>) => {
      state.appState = action.payload
    },
    setWalletState: (state, action: PayloadAction<WalletState>) => {
      state.walletState = action.payload
    },
    setWalletType: (state, action: PayloadAction<WalletType>) => {
      state.walletType = action.payload
    }
  }
})

// selectors
export const selectIsReady = (state: RootState): boolean => state.app.isReady

export const selectIsLocked = (state: RootState): boolean => state.app.isLocked

export const selectIsIdled = (state: RootState): boolean => state.app.isIdled

export const selectAppState = (state: RootState): AppStateStatus =>
  state.app.appState

export const selectWalletState = (state: RootState): WalletState =>
  state.app.walletState

// actions
// when app rehydration is complete
export const onRehydrationComplete = createAction(
  `${reducerName}/onRehydrationComplete`
)

// when user has successfully entered pin or biometrics to unlock the app
export const onAppUnlocked = createAction(`${reducerName}/onAppUnlocked`)

// when app is locked and user is required to unlock to use app again
export const onAppLocked = createAction(`${reducerName}/onAppLocked`)

export const onBackground = createAction(`${reducerName}/onBackground`)

/**
 * It dispatches once the app has gone to background then foreground again.
 * It doesn't dispatch on app start.
 */
export const onForeground = createAction(`${reducerName}/onForeground`)

// when user has successfully created/recovered a wallet
export const onLogIn = createAction(`${reducerName}/onLogIn`)

// when user has successfully "destroyed" a wallet
export const onLogOut = createAction(`${reducerName}/onLogOut`)

export const {
  setIsReady,
  setIsLocked,
  setIsIdled,
  setAppState,
  setWalletState,
  setWalletType
} = appSlice.actions

export const appReducer = appSlice.reducer
