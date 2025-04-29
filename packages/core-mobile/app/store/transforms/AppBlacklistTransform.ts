import { createTransform } from 'redux-persist'
import { RawRootState } from 'store/types'
import { AppState, initialState, reducerName } from 'store/app'

// a transform for app to blacklist everything except walletState and walletType
export const AppBlacklistTransform = createTransform<
  AppState,
  AppState,
  RawRootState,
  RawRootState
>(
  // transform state before it gets serialized and persisted
  (inboundState: AppState) => {
    return {
      ...initialState,
      walletState: inboundState.walletState,
      walletType: inboundState.walletType
    }
  },
  // transform state after it gets rehydrated
  (outboundState: AppState) => {
    return {
      ...initialState,
      walletState: outboundState.walletState,
      walletType: outboundState.walletType
    }
  },
  {
    whitelist: [reducerName]
  }
)
