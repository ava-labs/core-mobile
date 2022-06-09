import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Platform } from 'react-native'
import { RootState } from 'store'
import { AppStartListening } from 'store/middleware/listener'
import { getNetworks } from 'store/network'
import BiometricsSDK from 'utils/BiometricsSDK'

type AppState = {
  // we use this flag to show a splash screen while preparing the app (fetching networks, warming up BiometricsSDK,...)
  isReady: boolean
}

const reducerName = 'app'

const initialState: AppState = {
  isReady: false
}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setIsReady: (state, action: PayloadAction<boolean>) => {
      state.isReady = action.payload
    }
  }
})

// selectors
export const selectIsReady = (state: RootState) => state.app.isReady

// actions
// when app rehydration is complete
export const onRehydrationComplete = createAction(
  `${reducerName}/onRehydrationComplete`
)

// when user has successfully entered pin or biometrics to unlock the app
export const onLoginSuccess = createAction(`${reducerName}/onLoginSuccess`)

export const { setIsReady } = appSlice.actions

// listeners
export const addAppListeners = (startListening: AppStartListening) => {
  startListening({
    actionCreator: onRehydrationComplete,
    effect: async (action, listenerApi) => {
      const dispatch = listenerApi.dispatch
      dispatch(getNetworks())

      if (Platform.OS === 'android') BiometricsSDK.warmup()

      // artificially delay for 4.5s to allow splash screen's animation to finish
      await new Promise(resolve => setTimeout(resolve, 4500))

      dispatch(setIsReady(true))
    }
  })
}

export const appReducer = appSlice.reducer
